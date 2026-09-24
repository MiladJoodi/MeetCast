import "server-only";

import { and, asc, count, desc, eq, gt, lte } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import {
  roomMembers,
  rooms,
  users,
  type MemberRole,
  type Room,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { deriveRoomStatus, roomStatusLabel } from "@/lib/rooms/schedule";

export type RoomWithHost = Room & {
  hostName: string;
};

export const getRoomById = cache(async (roomId: string): Promise<Room | null> => {
  const rows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  return rows[0] ?? null;
});

export async function getRoomByInviteCode(
  inviteCode: string,
): Promise<Room | null> {
  const rows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.inviteCode, inviteCode))
    .limit(1);

  return rows[0] ?? null;
}

export async function requireRoomRecord(roomId: string): Promise<Room> {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new AppError("NOT_FOUND", "Room not found.", 404);
  }
  return room;
}

export async function listHostedRooms(hostUserId: string): Promise<Room[]> {
  return db
    .select()
    .from(rooms)
    .where(eq(rooms.hostUserId, hostUserId))
    .orderBy(desc(rooms.createdAt));
}

export const HOSTED_ROOMS_PAGE_SIZE = 10;

export async function countHostedRooms(hostUserId: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(rooms)
    .where(eq(rooms.hostUserId, hostUserId));

  return Number(rows[0]?.value ?? 0);
}

/** Rooms that have not ended yet (scheduled or live). */
export async function countOpenHostedRooms(
  hostUserId: string,
  now: Date = new Date(),
): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(rooms)
    .where(and(eq(rooms.hostUserId, hostUserId), gt(rooms.endTime, now)));

  return Number(rows[0]?.value ?? 0);
}

/** All open hosted rooms (live + scheduled), soonest start first. */
export async function listOpenHostedRooms(
  hostUserId: string,
  now: Date = new Date(),
): Promise<Room[]> {
  return db
    .select()
    .from(rooms)
    .where(and(eq(rooms.hostUserId, hostUserId), gt(rooms.endTime, now)))
    .orderBy(asc(rooms.startTime));
}

/** Recently ended hosted rooms for the dashboard. */
export async function listRecentEndedHostedRooms(
  hostUserId: string,
  limit: number = 5,
  now: Date = new Date(),
): Promise<Room[]> {
  return db
    .select()
    .from(rooms)
    .where(and(eq(rooms.hostUserId, hostUserId), lte(rooms.endTime, now)))
    .orderBy(desc(rooms.endTime))
    .limit(limit);
}

export async function listHostedRoomsPage(
  hostUserId: string,
  page: number,
  pageSize: number = HOSTED_ROOMS_PAGE_SIZE,
): Promise<Room[]> {
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  return db
    .select()
    .from(rooms)
    .where(eq(rooms.hostUserId, hostUserId))
    .orderBy(desc(rooms.createdAt))
    .limit(pageSize)
    .offset(offset);
}

export async function getMembership(
  roomId: string,
  userId: string,
): Promise<{ id: string; role: MemberRole } | null> {
  const rows = await db
    .select({
      id: roomMembers.id,
      role: roomMembers.role,
    })
    .from(roomMembers)
    .where(
      and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
    )
    .limit(1);

  return rows[0] ?? null;
}

export type RoomMemberListItem = {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
};

export async function listRoomMembers(
  roomId: string,
): Promise<RoomMemberListItem[]> {
  const rows = await db
    .select({
      userId: roomMembers.userId,
      role: roomMembers.role,
      name: users.name,
      email: users.email,
    })
    .from(roomMembers)
    .innerJoin(users, eq(users.id, roomMembers.userId))
    .where(eq(roomMembers.roomId, roomId))
    .orderBy(roomMembers.createdAt);

  return rows;
}

export async function countAuthenticatedMembers(
  roomId: string,
): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(roomMembers)
    .where(eq(roomMembers.roomId, roomId));

  return rows[0]?.value ?? 0;
}

/** Public room fields safe for clients (excludes nothing sensitive beyond invite for hosts). */
export function toPublicRoom(
  room: Room,
  options?: { includeInviteCode?: boolean },
) {
  const status = deriveRoomStatus(room);
  return {
    id: room.id,
    title: room.title,
    type: room.type,
    status,
    statusLabel: roomStatusLabel(status),
    startTime: room.startTime,
    endTime: room.endTime,
    hostUserId: room.hostUserId,
    maxParticipants: room.maxParticipants,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    ...(options?.includeInviteCode ? { inviteCode: room.inviteCode } : {}),
  };
}
