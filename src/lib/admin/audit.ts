import "server-only";

import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { sanitizeAuditMetadata } from "@/lib/admin/audit-sanitize";
import type {
  AdminAuditAction,
  AdminAuditTargetType,
} from "@/lib/admin/audit-types";
import { logger } from "@/lib/logger";

export { sanitizeAuditMetadata } from "@/lib/admin/audit-sanitize";
export {
  ADMIN_AUDIT_ACTIONS,
  type AdminAuditAction,
  type AdminAuditTargetType,
} from "@/lib/admin/audit-types";

export async function writeAdminAuditLog(input: {
  actorUserId: string | null;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(adminAuditLogs).values({
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: sanitizeAuditMetadata(input.metadata) ?? null,
    });
  } catch (error) {
    logger.error("admin.audit_write_failed", {
      action: input.action,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
