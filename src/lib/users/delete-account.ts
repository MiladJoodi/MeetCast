import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { rooms, users } from "@/db/schema";
import { deleteLiveKitRoom } from "@/lib/livekit/token";
import { logger } from "@/lib/logger";

/**
 * Permanently delete a user and their hosted rooms.
 * Caller must enforce authorization (self password check or admin).
 * Does not clear cookies — caller handles session cookies when needed.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const hosted = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(eq(rooms.hostUserId, userId));

  for (const room of hosted) {
    await deleteLiveKitRoom(room.id);
  }

  if (hosted.length > 0) {
    await db.delete(rooms).where(eq(rooms.hostUserId, userId));
  }

  await db.delete(users).where(eq(users.id, userId));

  logger.info("users.account_deleted", {
    userId,
    hostedRooms: hosted.length,
  });
}
