export const ADMIN_AUDIT_ACTIONS = [
  "user.role_changed",
  "user.sessions_revoked",
  "user.deleted",
  "user.plan_changed",
  "user.blocked",
  "user.unblocked",
  "user.membership_revoked",
  "room.deleted",
  "room.ended",
  "plan.created",
  "plan.updated",
  "plan.activated",
  "plan.deactivated",
  "plan.deleted",
  "order.paid",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export type AdminAuditTargetType = "user" | "room" | "plan" | "order";
