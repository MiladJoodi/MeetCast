import { AppError } from "@/lib/errors";
import {
  isHost,
  isModeratorOrHost,
  type RoomAccessActor,
} from "@/lib/rooms/actors";
import type { MemberRole } from "@/db/schema";

export type TargetAppRole = MemberRole | "guest";

/**
 * Enforce who may moderate whom. Never trust client role claims.
 */
export function assertCanModerateTarget(input: {
  actor: RoomAccessActor;
  targetRole: TargetAppRole;
  targetIdentity: string;
  actorIdentity: string;
}): void {
  const { actor, targetRole, targetIdentity, actorIdentity } = input;

  if (!isModeratorOrHost(actor)) {
    throw new AppError(
      "FORBIDDEN",
      "Only a host or moderator can moderate participants.",
      403,
    );
  }

  if (targetIdentity === actorIdentity) {
    throw new AppError("FORBIDDEN", "You cannot moderate yourself.", 403);
  }

  if (targetRole === "host") {
    throw new AppError(
      "FORBIDDEN",
      "The room host cannot be moderated.",
      403,
    );
  }

  // Moderators may only act on participants/guests — not other moderators.
  if (targetRole === "moderator" && !isHost(actor)) {
    throw new AppError(
      "FORBIDDEN",
      "Only the host can moderate a moderator.",
      403,
    );
  }
}

export function assertCanManageModeratorRole(actor: RoomAccessActor): void {
  if (!isHost(actor)) {
    throw new AppError(
      "FORBIDDEN",
      "Only the room host can manage moderators.",
      403,
    );
  }
}
