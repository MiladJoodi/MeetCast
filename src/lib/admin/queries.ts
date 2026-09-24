import "server-only";

import { and, count, desc, eq, gt, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import {
  adminAuditLogs,
  plans,
  roomMembers,
  rooms,
  sessions,
  users,
  type AdminAuditLog,
  type Room,
  type User,
  type UserRole,
} from "@/db/schema";
import {
  ADMIN_PAGE_SIZE,
  clampPageToTotal,
  normalizeAdminSearchQuery,
} from "@/lib/admin/pagination";
import { auditActionsMatchingQuery } from "@/lib/admin/audit-labels";

export {
  ADMIN_MAX_PAGE,
  ADMIN_MAX_SEARCH_LENGTH,
  ADMIN_PAGE_SIZE,
  clampPageToTotal,
  normalizeAdminSearchQuery,
  totalPages,
} from "@/lib/admin/pagination";

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  planId: string;
  blockedAt: Date | null;
  createdAt: Date;
};

export type AdminRoomListItem = {
  id: string;
  title: string;
  hostUserId: string;
  hostName: string;
  hostEmail: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  maxParticipants: number;
  inviteCode: string;
  type: Room["type"];
};

export type AdminPlanShare = {
  planId: string;
  name: string;
  users: number;
};

export type AdminOverviewStats = {
  totalUsers: number;
  adminUsers: number;
  totalRooms: number;
  scheduledRooms: number;
  liveRooms: number;
  endedRooms: number;
  activePlans: number;
  usersByPlan: AdminPlanShare[];
};

export async function getAdminOverviewStats(
  now: Date = new Date(),
): Promise<AdminOverviewStats> {
  const [
    [userCount],
    [adminCount],
    [roomCount],
    [scheduled],
    [live],
    [ended],
    [activePlanCount],
    planShares,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "admin")),
    db.select({ value: count() }).from(rooms),
    db
      .select({ value: count() })
      .from(rooms)
      .where(gt(rooms.startTime, now)),
    db
      .select({ value: count() })
      .from(rooms)
      .where(and(lte(rooms.startTime, now), gt(rooms.endTime, now))),
    db
      .select({ value: count() })
      .from(rooms)
      .where(lte(rooms.endTime, now)),
    db
      .select({ value: count() })
      .from(plans)
      .where(eq(plans.isActive, true)),
    db
      .select({
        planId: plans.id,
        name: plans.name,
        users: count(users.id),
      })
      .from(plans)
      .leftJoin(users, eq(users.planId, plans.id))
      .groupBy(plans.id, plans.name)
      .orderBy(desc(count(users.id))),
  ]);

  return {
    totalUsers: Number(userCount?.value ?? 0),
    adminUsers: Number(adminCount?.value ?? 0),
    totalRooms: Number(roomCount?.value ?? 0),
    scheduledRooms: Number(scheduled?.value ?? 0),
    liveRooms: Number(live?.value ?? 0),
    endedRooms: Number(ended?.value ?? 0),
    activePlans: Number(activePlanCount?.value ?? 0),
    usersByPlan: planShares.map((row) => ({
      planId: row.planId,
      name: row.name,
      users: Number(row.users ?? 0),
    })),
  };
}

export type AdminUserRoleFilter = "user" | "admin";

function parseAdminDateBound(value: string | undefined, endOfDay: boolean): Date | null {
  const raw = value?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  const date = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listUsersPage(input: {
  page: number;
  query?: string;
  role?: AdminUserRoleFilter;
  from?: string;
  to?: string;
}): Promise<{ rows: AdminUserListItem[]; total: number; page: number }> {
  const q = normalizeAdminSearchQuery(input.query);
  const fromDate = parseAdminDateBound(input.from, false);
  const toDate = parseAdminDateBound(input.to, true);
  const filters: SQL[] = [];

  if (q.length > 0) {
    const search = or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`));
    if (search) filters.push(search);
  }
  if (input.role) {
    filters.push(eq(users.role, input.role));
  }
  if (fromDate) {
    filters.push(gte(users.createdAt, fromDate));
  }
  if (toDate) {
    filters.push(lte(users.createdAt, toDate));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(users)
    .where(where);

  const total = Number(totalRow?.value ?? 0);
  const page = clampPageToTotal(input.page, total);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      planId: users.planId,
      blockedAt: users.blockedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(ADMIN_PAGE_SIZE)
    .offset((page - 1) * ADMIN_PAGE_SIZE);

  return {
    rows,
    total,
    page,
  };
}

export const getAdminUserDetail = cache(async (
  userId: string,
): Promise<{
  user: AdminUserListItem;
  hostedRoomCount: number;
  membershipCount: number;
  activeSessionCount: number;
} | null> => {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      planId: users.planId,
      blockedAt: users.blockedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user) {
    return null;
  }

  const [[hosted], [memberships], [activeSessions]] = await Promise.all([
    db
      .select({ value: count() })
      .from(rooms)
      .where(eq(rooms.hostUserId, userId)),
    db
      .select({ value: count() })
      .from(roomMembers)
      .where(eq(roomMembers.userId, userId)),
    db
      .select({ value: count() })
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())),
      ),
  ]);

  return {
    user,
    hostedRoomCount: Number(hosted?.value ?? 0),
    membershipCount: Number(memberships?.value ?? 0),
    activeSessionCount: Number(activeSessions?.value ?? 0),
  };
});

export type AdminRoomStatusFilter = "scheduled" | "live" | "ended";

function roomStatusWhere(
  status: AdminRoomStatusFilter,
  now: Date,
): SQL | undefined {
  switch (status) {
    case "scheduled":
      return gt(rooms.startTime, now);
    case "live":
      return and(lte(rooms.startTime, now), gt(rooms.endTime, now));
    case "ended":
      return lte(rooms.endTime, now);
    default:
      return undefined;
  }
}

export async function listRoomsPage(input: {
  page: number;
  query?: string;
  status?: AdminRoomStatusFilter;
  from?: string;
  to?: string;
  now?: Date;
}): Promise<{ rows: AdminRoomListItem[]; total: number; page: number }> {
  const q = normalizeAdminSearchQuery(input.query);
  const host = users;
  const now = input.now ?? new Date();
  const fromDate = parseAdminDateBound(input.from, false);
  const toDate = parseAdminDateBound(input.to, true);

  const filters: SQL[] = [];

  if (q.length > 0) {
    const search = or(
      ilike(rooms.title, `%${q}%`),
      ilike(host.name, `%${q}%`),
      ilike(host.email, `%${q}%`),
    );
    if (search) filters.push(search);
  }

  if (input.status) {
    const statusFilter = roomStatusWhere(input.status, now);
    if (statusFilter) filters.push(statusFilter);
  }

  if (fromDate) {
    filters.push(gte(rooms.startTime, fromDate));
  }
  if (toDate) {
    filters.push(lte(rooms.startTime, toDate));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(rooms)
    .innerJoin(host, eq(rooms.hostUserId, host.id))
    .where(where);

  const total = Number(totalRow?.value ?? 0);
  const page = clampPageToTotal(input.page, total);

  const rows = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      hostUserId: rooms.hostUserId,
      hostName: host.name,
      hostEmail: host.email,
      startTime: rooms.startTime,
      endTime: rooms.endTime,
      createdAt: rooms.createdAt,
      maxParticipants: rooms.maxParticipants,
      inviteCode: rooms.inviteCode,
      type: rooms.type,
    })
    .from(rooms)
    .innerJoin(host, eq(rooms.hostUserId, host.id))
    .where(where)
    .orderBy(desc(rooms.createdAt))
    .limit(ADMIN_PAGE_SIZE)
    .offset((page - 1) * ADMIN_PAGE_SIZE);

  return {
    rows,
    total,
    page,
  };
}

export async function getAdminRoomDetail(roomId: string): Promise<{
  room: Room;
  host: Pick<User, "id" | "name" | "email">;
} | null> {
  const rows = await db
    .select({
      room: rooms,
      hostId: users.id,
      hostName: users.name,
      hostEmail: users.email,
    })
    .from(rooms)
    .innerJoin(users, eq(rooms.hostUserId, users.id))
    .where(eq(rooms.id, roomId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    room: row.room,
    host: {
      id: row.hostId,
      name: row.hostName,
      email: row.hostEmail,
    },
  };
}

export async function listAuditLogsPage(input: {
  page: number;
  query?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
}): Promise<{
  rows: Array<
    AdminAuditLog & {
      actorName: string | null;
      actorEmail: string | null;
    }
  >;
  total: number;
  page: number;
}> {
  const q = normalizeAdminSearchQuery(input.query);
  const fromDate = parseAdminDateBound(input.from, false);
  const toDate = parseAdminDateBound(input.to, true);
  const filters: SQL[] = [];

  if (input.action?.trim()) {
    filters.push(eq(adminAuditLogs.action, input.action.trim()));
  }
  if (input.targetType?.trim()) {
    filters.push(eq(adminAuditLogs.targetType, input.targetType.trim()));
  }
  if (fromDate) {
    filters.push(gte(adminAuditLogs.createdAt, fromDate));
  }
  if (toDate) {
    filters.push(lte(adminAuditLogs.createdAt, toDate));
  }
  if (q.length > 0) {
    const matchedActions = auditActionsMatchingQuery(q);
    const searchParts: SQL[] = [
      ilike(adminAuditLogs.action, `%${q}%`),
      ilike(adminAuditLogs.targetType, `%${q}%`),
      ilike(adminAuditLogs.targetId, `%${q}%`),
      ilike(users.name, `%${q}%`),
      ilike(users.email, `%${q}%`),
    ];
    for (const action of matchedActions) {
      searchParts.push(eq(adminAuditLogs.action, action));
    }
    const search = or(...searchParts);
    if (search) filters.push(search);
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(adminAuditLogs)
    .leftJoin(users, eq(adminAuditLogs.actorUserId, users.id))
    .where(where);

  const total = Number(totalRow?.value ?? 0);
  const page = clampPageToTotal(input.page, total);

  const rows = await db
    .select({
      id: adminAuditLogs.id,
      actorUserId: adminAuditLogs.actorUserId,
      action: adminAuditLogs.action,
      targetType: adminAuditLogs.targetType,
      targetId: adminAuditLogs.targetId,
      metadata: adminAuditLogs.metadata,
      createdAt: adminAuditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(adminAuditLogs)
    .leftJoin(users, eq(adminAuditLogs.actorUserId, users.id))
    .where(where)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(ADMIN_PAGE_SIZE)
    .offset((page - 1) * ADMIN_PAGE_SIZE);

  return {
    rows,
    total,
    page,
  };
}
