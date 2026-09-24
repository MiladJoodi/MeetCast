import type { Room } from "@/db/schema";
import { AppError } from "@/lib/errors";

/**
 * Soft authenticated-member capacity check used by invite join flows.
 * LiveKit token issuance uses SFU listParticipants + room maxParticipants separately.
 */
export async function assertJoinCapacityAvailable(
  room: Room,
  authenticatedMemberCount: number,
): Promise<void> {
  if (authenticatedMemberCount >= room.maxParticipants) {
    throw new AppError("ROOM_FULL", "Room is full.", 409);
  }
}
