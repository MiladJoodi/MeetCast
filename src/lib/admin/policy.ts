import type { PublicUser, UserRole } from "@/db/schema";
import { AppError } from "@/lib/errors";

export function isAdmin(user: Pick<PublicUser, "role">): boolean {
  return user.role === "admin";
}

export function assertIsAdmin(user: Pick<PublicUser, "role">): void {
  if (!isAdmin(user)) {
    throw new AppError("FORBIDDEN", "Admin access required.", 403);
  }
}

export function isValidUserRole(role: string): role is UserRole {
  return role === "user" || role === "admin";
}

/**
 * Whether an admin may change a target user's global role.
 * Blocks self-demotion and demoting the last remaining admin.
 */
export function assertCanChangeUserRole(input: {
  actorId: string;
  targetId: string;
  targetCurrentRole: UserRole;
  nextRole: UserRole;
  adminCount: number;
}): void {
  if (!isValidUserRole(input.nextRole)) {
    throw new AppError("VALIDATION_ERROR", "Invalid role.", 400);
  }

  if (input.targetCurrentRole === input.nextRole) {
    return;
  }

  if (
    input.actorId === input.targetId &&
    input.targetCurrentRole === "admin" &&
    input.nextRole === "user"
  ) {
    throw new AppError(
      "FORBIDDEN",
      "You cannot demote your own admin account.",
      403,
    );
  }

  if (input.targetCurrentRole === "admin" && input.nextRole === "user") {
    if (input.adminCount <= 1) {
      throw new AppError(
        "FORBIDDEN",
        "Cannot demote the last remaining administrator.",
        403,
      );
    }
  }
}

export function assertCanDeleteUserAsAdmin(input: {
  actorId: string;
  targetId: string;
}): void {
  if (input.actorId === input.targetId) {
    throw new AppError(
      "FORBIDDEN",
      "You cannot delete your own account from the Admin Panel.",
      403,
    );
  }
}

export function assertCanBlockUserAsAdmin(input: {
  actorId: string;
  targetId: string;
  targetRole: UserRole;
  adminCount: number;
}): void {
  if (input.actorId === input.targetId) {
    throw new AppError(
      "FORBIDDEN",
      "You cannot block your own account.",
      403,
    );
  }

  if (input.targetRole === "admin" && input.adminCount <= 1) {
    throw new AppError(
      "FORBIDDEN",
      "Cannot block the last remaining administrator.",
      403,
    );
  }
}
