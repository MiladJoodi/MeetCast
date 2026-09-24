import { AppError } from "@/lib/errors";
import { getMaxRoomDurationMs } from "@/lib/rooms/constants";

/** Absolute ceiling for a token; also capped by meeting endTime at issue time. */
export function getLiveKitTokenTtlCeilingSeconds(): number {
  return Math.floor(getMaxRoomDurationMs() / 1000);
}

export function clampTokenTtlSeconds(input: {
  requestedSeconds?: number;
  secondsUntilEnd: number;
}): number {
  const ceiling = getLiveKitTokenTtlCeilingSeconds();
  return Math.max(
    1,
    Math.min(
      ceiling,
      input.secondsUntilEnd,
      input.requestedSeconds ?? ceiling,
    ),
  );
}

/** Pure LiveKit occupancy gate — SFU maxParticipants remains the hard bound. */
export function assertParticipantCountWithinCapacity(
  count: number,
  maxParticipants: number,
): void {
  if (count >= maxParticipants) {
    throw new AppError("ROOM_FULL", "Room is full.", 409);
  }
}
