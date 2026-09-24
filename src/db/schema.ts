import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roomTypeEnum = pgEnum("room_type", ["meeting", "webinar"]);

export const roomVisibilityEnum = pgEnum("room_visibility", [
  "public",
  "private",
]);

export const roomStatusEnum = pgEnum("room_status", [
  "waiting",
  "active",
  "ended",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "host",
  "moderator",
  "participant",
]);

/** Global platform role — independent of room-level member roles. */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

/**
 * Plan definitions with commercial price (one-time purchase, IRR rials).
 * maxRoomDurationMinutes null = unlimited within the technical app ceiling.
 */
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    maxConcurrentParticipants: integer("max_concurrent_participants").notNull(),
    maxRoomDurationMinutes: integer("max_room_duration_minutes"),
    /** Price in minor units of currency (IRR rials). */
    priceAmount: integer("price_amount").notNull().default(0),
    currency: text("currency").notNull().default("IRR"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("plans_slug_uidx").on(table.slug),
    index("plans_is_active_idx").on(table.isActive),
  ],
);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "cancelled",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    /** When set, the account cannot sign in or use the app. */
    blockedAt: timestamp("blocked_at", { withTimezone: true }),
    /** Optional — login works even when null. Set by email verification link. */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_email_uidx").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_plan_id_idx").on(table.planId),
    index("users_blocked_at_idx").on(table.blockedAt),
  ],
);

/**
 * One-time plan purchase orders.
 * Snapshot fields keep history accurate if the plan is later edited.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    planNameSnapshot: text("plan_name_snapshot").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    provider: text("provider"),
    providerReference: text("provider_reference"),
    paymentUrl: text("payment_url"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("orders_idempotency_key_uidx").on(table.idempotencyKey),
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_provider_reference_idx").on(table.providerReference),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 hex of the opaque session token stored in the httpOnly cookie. */
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_uidx").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "email_verify",
  "password_reset",
]);

/**
 * One-time tokens for email verification and password reset.
 * Raw token is emailed; only the SHA-256 hash is stored.
 */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: authTokenTypeEnum("type").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_tokens_token_hash_uidx").on(table.tokenHash),
    index("auth_tokens_user_id_idx").on(table.userId),
    index("auth_tokens_type_idx").on(table.type),
    index("auth_tokens_expires_at_idx").on(table.expiresAt),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    type: roomTypeEnum("type").notNull(),
    status: roomStatusEnum("status").notNull().default("waiting"),
    /** Public = anyone with invite; Private = allowlisted account emails only. */
    visibility: roomVisibilityEnum("visibility").notNull().default("public"),
    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /** Application default is 50; stored as a column so the limit can change without a schema rewrite. */
    maxParticipants: integer("max_participants").notNull().default(50),
    /** Opaque invite code; guests join with this — no user row required. */
    inviteCode: text("invite_code").notNull(),
    /** Meeting window start (UTC). Status is derived from now vs start/end. */
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    /** Meeting window end (UTC). Join and tokens are rejected at/after this. */
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("rooms_invite_code_uidx").on(table.inviteCode),
    index("rooms_host_user_id_idx").on(table.hostUserId),
    index("rooms_status_idx").on(table.status),
    index("rooms_visibility_idx").on(table.visibility),
    index("rooms_start_time_idx").on(table.startTime),
    index("rooms_end_time_idx").on(table.endTime),
  ],
);

/**
 * Authenticated room membership only.
 * Guests do not appear here — they join via rooms.inviteCode and LiveKit identity.
 */
export const roomMembers = pgTable(
  "room_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("participant"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("room_members_room_user_uidx").on(table.roomId, table.userId),
    index("room_members_user_id_idx").on(table.userId),
    index("room_members_room_id_idx").on(table.roomId),
    index("room_members_room_role_idx").on(table.roomId, table.role),
  ],
);

/**
 * Email allowlist for rooms.
 * Enforced only when room.visibility is "private".
 * Host is always allowed. List may be retained while visibility is public.
 */
export const roomAllowedEmails = pgTable(
  "room_allowed_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("room_allowed_emails_room_email_uidx").on(
      table.roomId,
      table.email,
    ),
    index("room_allowed_emails_room_id_idx").on(table.roomId),
  ],
);

/**
 * Guests kicked from a room. Cookie cannot be cleared on the moderator request,
 * so token issuance checks this list server-side.
 */
export const revokedGuests = pgTable(
  "revoked_guests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    guestId: text("guest_id").notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("revoked_guests_room_guest_uidx").on(
      table.roomId,
      table.guestId,
    ),
    index("revoked_guests_room_id_idx").on(table.roomId),
  ],
);

/**
 * Append-only admin audit trail. Actor FK is SET NULL so deleting an admin
 * retains historical records.
 */
export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_audit_logs_created_at_idx").on(table.createdAt),
    index("admin_audit_logs_action_idx").on(table.action),
    index("admin_audit_logs_target_type_idx").on(table.targetType),
    index("admin_audit_logs_actor_user_id_idx").on(table.actorUserId),
  ],
);

/** Sliding-window rate-limit event log (PostgreSQL; soft races OK with neon-http). */
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bucketKey: text("bucket_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("rate_limit_events_bucket_created_idx").on(
      table.bucketKey,
      table.createdAt,
    ),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  plan: one(plans, {
    fields: [users.planId],
    references: [plans.id],
  }),
  hostedRooms: many(rooms),
  memberships: many(roomMembers),
  sessions: many(sessions),
  auditLogs: many(adminAuditLogs),
  orders: many(orders),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  users: many(users),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [orders.planId],
    references: [plans.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  host: one(users, {
    fields: [rooms.hostUserId],
    references: [users.id],
  }),
  members: many(roomMembers),
  allowedEmails: many(roomAllowedEmails),
  revokedGuests: many(revokedGuests),
}));

export const roomAllowedEmailsRelations = relations(
  roomAllowedEmails,
  ({ one }) => ({
    room: one(rooms, {
      fields: [roomAllowedEmails.roomId],
      references: [rooms.id],
    }),
  }),
);

export const revokedGuestsRelations = relations(revokedGuests, ({ one }) => ({
  room: one(rooms, {
    fields: [revokedGuests.roomId],
    references: [rooms.id],
  }),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.userId],
    references: [users.id],
  }),
}));

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [adminAuditLogs.actorUserId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type RoomMember = typeof roomMembers.$inferSelect;
export type NewRoomMember = typeof roomMembers.$inferInsert;
export type RoomAllowedEmail = typeof roomAllowedEmails.$inferSelect;
export type NewRoomAllowedEmail = typeof roomAllowedEmails.$inferInsert;
export type RevokedGuest = typeof revokedGuests.$inferSelect;
export type NewRevokedGuest = typeof revokedGuests.$inferInsert;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLogs.$inferInsert;

export type RoomType = (typeof roomTypeEnum.enumValues)[number];
export type RoomStatus = (typeof roomStatusEnum.enumValues)[number];
export type RoomVisibility = (typeof roomVisibilityEnum.enumValues)[number];
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type AuthTokenType = (typeof authTokenTypeEnum.enumValues)[number];

/** Safe user fields for client-facing responses (never includes passwordHash). */
export type PublicUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "planId" | "createdAt"
>;
