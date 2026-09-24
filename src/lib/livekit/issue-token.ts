import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { rooms, type Room } from "@/db/schema";
import { AppError } from "@/lib/errors";
import {
  toAppRole,
  toLiveKitDisplayName,
  toLiveKitIdentity,
} from "@/lib/livekit/identity";
import {
  assertLiveKitCapacityAvailable,
  createLiveKitAccessToken,
  deleteLiveKitRoom,
  ensureLiveKitRoom,
  type LiveKitTokenResult,
} from "@/lib/livekit/token";
import { logger } from "@/lib/logger";
import { assertAccountConcurrentCapacity } from "@/lib/plans/usage";
import { requireRoomAccess } from "@/lib/rooms/authorization";
import {
  assertRoomJoinWindow,
  deriveRoomStatus,
  legacyStatusFromDerived,
} from "@/lib/rooms/schedule";

/**
 * Best-effort sync of the legacy status column + LiveKit teardown when ended.
 * Schedule timestamps remain the source of truth for joinability.
 */
async function syncEndedRoom(room: Room, now: Date): Promise<void> {
  const status = deriveRoomStatus(room, now);
  if (status !== "ended") {
    return;
  }

  if (room.status !== "ended") {
    try {
      await db
        .update(rooms)
        .set({ status: legacyStatusFromDerived(status) })
        .where(eq(rooms.id, room.id));
    } catch (error) {
      logger.warn("rooms.status_sync_failed", {
        roomId: room.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  await deleteLiveKitRoom(room.id);
}

/**
 * Full authorized LiveKit token issuance pipeline.
 * Application authz → schedule window → account plan capacity → LiveKit room → token.
 *
 * Capacity races: soft check via listParticipants is not atomic under concurrent
 * joins; LiveKit room maxParticipants is the hard SFU bound. Account-wide plan
 * limits similarly soft across rooms (see Phase 4 plan notes).
 */
export async function issueLiveKitTokenForRoom(
  applicationRoomId: string,
): Promise<LiveKitTokenResult> {
  const access = await requireRoomAccess(applicationRoomId);
  const { room, actor } = access;
  const now = new Date();

  try {
    assertRoomJoinWindow(room, now);
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      await syncEndedRoom(room, now);
    }
    throw error;
  }

  const identity = toLiveKitIdentity(actor);
  const displayName = toLiveKitDisplayName(actor);
  const role = toAppRole(actor);

  const secondsUntilEnd = Math.floor(
    (room.endTime.getTime() - now.getTime()) / 1000,
  );
  if (secondsUntilEnd <= 0) {
    await syncEndedRoom(room, now);
    throw new AppError("FORBIDDEN", "This room has ended.", 403);
  }

  await assertAccountConcurrentCapacity({
    hostUserId: room.hostUserId,
    roomId: room.id,
    identity,
  });

  await ensureLiveKitRoom(room);
  await assertLiveKitCapacityAvailable(room);

  // Keep legacy status roughly in sync while live.
  if (room.status === "waiting") {
    try {
      await db
        .update(rooms)
        .set({ status: "active" })
        .where(eq(rooms.id, room.id));
    } catch {
      // Non-critical.
    }
  }

  const result = await createLiveKitAccessToken({
    room,
    actor,
    identity,
    displayName,
    role,
    ttlSeconds: secondsUntilEnd,
  });

  logger.info("livekit.token_issued", {
    roomId: room.id,
    role,
    kind: actor.kind,
  });

  return result;
}
