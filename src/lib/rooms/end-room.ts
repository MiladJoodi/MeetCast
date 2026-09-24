import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { rooms, type Room } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { deleteLiveKitRoom } from "@/lib/livekit/token";
import { logger } from "@/lib/logger";
import { deriveRoomStatus } from "@/lib/rooms/schedule";

/**
 * End a live room immediately by closing the schedule window and tearing down LiveKit.
 * Does not rewrite startTime.
 */
export async function endRoomNow(room: Room): Promise<Room> {
  const status = deriveRoomStatus(room);
  if (status !== "live") {
    throw new AppError(
      "CONFLICT",
      status === "ended"
        ? "This room has already ended."
        : "Only live rooms can be ended early.",
      409,
    );
  }

  const now = new Date();
  const updated = await db
    .update(rooms)
    .set({
      endTime: now,
      status: "ended",
    })
    .where(eq(rooms.id, room.id))
    .returning();

  await deleteLiveKitRoom(room.id);

  logger.info("rooms.ended_now", { roomId: room.id });

  return updated[0] ?? { ...room, endTime: now, status: "ended" };
}
