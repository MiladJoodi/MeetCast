import "server-only";

import type { Room } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { parseLiveKitIdentity } from "@/lib/livekit/parse-identity";
import type { TargetAppRole } from "@/lib/rooms/moderation-rules";
import { getMembership } from "@/lib/rooms/queries";

export type { TargetAppRole } from "@/lib/rooms/moderation-rules";
export {
  assertCanManageModeratorRole,
  assertCanModerateTarget,
} from "@/lib/rooms/moderation-rules";

/**
 * Resolve the application role of a LiveKit participant for moderation decisions.
 * Uses PostgreSQL membership / host ownership — not client-supplied role metadata.
 */
export async function resolveTargetAppRole(
  room: Room,
  targetIdentity: string,
): Promise<{
  parsed: NonNullable<ReturnType<typeof parseLiveKitIdentity>>;
  role: TargetAppRole;
}> {
  const parsed = parseLiveKitIdentity(targetIdentity);
  if (!parsed) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid participant identity.",
      400,
    );
  }

  if (parsed.kind === "guest") {
    if (parsed.roomId !== room.id) {
      throw new AppError(
        "FORBIDDEN",
        "Participant does not belong to this room.",
        403,
      );
    }
    return { parsed, role: "guest" };
  }

  if (parsed.userId === room.hostUserId) {
    return { parsed, role: "host" };
  }

  const membership = await getMembership(room.id, parsed.userId);
  if (!membership) {
    // Authenticated user may still be in LiveKit (e.g. race). Treat as participant
    // only after LiveKit confirms they are in this room (caller must verify).
    return { parsed, role: "participant" };
  }

  return { parsed, role: membership.role };
}
