import type { AdminAuditAction, AdminAuditTargetType } from "@/lib/admin/audit-types";

export {
  ADMIN_AUDIT_ACTIONS,
  type AdminAuditAction,
  type AdminAuditTargetType,
} from "@/lib/admin/audit-types";

export const AUDIT_ACTION_LABELS: Record<AdminAuditAction, string> = {
  "user.role_changed": "Role changed",
  "user.sessions_revoked": "Sessions revoked",
  "user.deleted": "User deleted",
  "user.plan_changed": "Plan changed",
  "user.blocked": "User blocked",
  "user.unblocked": "User unblocked",
  "user.membership_revoked": "Membership revoked",
  "room.deleted": "Room deleted",
  "room.ended": "Meeting ended",
  "plan.created": "Plan created",
  "plan.updated": "Plan updated",
  "plan.activated": "Plan activated",
  "plan.deactivated": "Plan deactivated",
  "plan.deleted": "Plan deleted",
  "order.paid": "Order paid",
};

export const AUDIT_TARGET_TYPE_LABELS: Record<AdminAuditTargetType, string> = {
  user: "User",
  room: "Room",
  plan: "Plan",
  order: "Order",
};

export function formatAuditActionLabel(action: string): string {
  if (action in AUDIT_ACTION_LABELS) {
    return AUDIT_ACTION_LABELS[action as AdminAuditAction];
  }
  return action;
}

export function formatAuditTargetTypeLabel(targetType: string): string {
  if (targetType in AUDIT_TARGET_TYPE_LABELS) {
    return AUDIT_TARGET_TYPE_LABELS[targetType as AdminAuditTargetType];
  }
  return targetType;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Short human summary of audit metadata, if any. */
export function formatAuditDetails(
  action: string,
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;

  switch (action) {
    case "user.role_changed": {
      const from = asString(metadata.from);
      const to = asString(metadata.to);
      if (from && to) return `${capitalize(from)} → ${capitalize(to)}`;
      if (to) return `Set to ${capitalize(to)}`;
      return null;
    }
    case "user.sessions_revoked": {
      const count = asNumber(metadata.count);
      if (count === null) return null;
      return count === 0
        ? "No active sessions"
        : `${count} session${count === 1 ? "" : "s"}`;
    }
    case "user.plan_changed": {
      const slug = asString(metadata.toSlug);
      return slug ? `Assigned “${slug}”` : null;
    }
    case "user.membership_revoked": {
      const fromSlug = asString(metadata.fromSlug);
      return fromSlug ? `Downgraded from “${fromSlug}”` : "Set to Free";
    }
    case "user.blocked":
      return "Signed out everywhere";
    case "user.unblocked":
      return "Login restored";
    case "order.paid": {
      const amount = asNumber(metadata.amount);
      const currency = asString(metadata.currency);
      if (amount !== null && currency) {
        return `${amount.toLocaleString("en-US")} ${currency}`;
      }
      return null;
    }
    case "plan.created":
    case "plan.updated":
    case "plan.activated":
    case "plan.deactivated":
    case "plan.deleted": {
      const name = asString(metadata.name);
      const slug = asString(metadata.slug);
      if (name && slug) return `${name} (${slug})`;
      return name ?? slug;
    }
    default:
      return null;
  }
}

export function auditTargetHref(
  targetType: string,
  targetId: string,
): string | null {
  if (!targetId) return null;
  switch (targetType) {
    case "user":
      return `/admin/users/${targetId}`;
    case "room":
      return `/admin/rooms/${targetId}`;
    case "plan":
      return `/admin/plans/${targetId}`;
    case "order":
      return `/admin/orders`;
    default:
      return null;
  }
}

/** Actions whose label or code matches a search query. */
export function auditActionsMatchingQuery(query: string): AdminAuditAction[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return (Object.keys(AUDIT_ACTION_LABELS) as AdminAuditAction[]).filter(
    (action) =>
      action.includes(q) || AUDIT_ACTION_LABELS[action].toLowerCase().includes(q),
  );
}
