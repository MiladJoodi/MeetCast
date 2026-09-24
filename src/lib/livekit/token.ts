import "server-only";

import { AccessToken } from "livekit-server-sdk";

import type { Room } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { getLiveKitServerConfig } from "@/lib/livekit/config";
import type { LiveKitAppRole } from "@/lib/livekit/identity";
import { grantsForRole } from "@/lib/livekit/grants";
import { createRoomServiceClient } from "@/lib/livekit/room-service";
import { toLiveKitRoomName } from "@/lib/livekit/room-name";
import {
  assertParticipantCountWithinCapacity,
  clampTokenTtlSeconds,
  getLiveKitTokenTtlCeilingSeconds,
} from "@/lib/livekit/token-limits";
import { logger } from "@/lib/logger";
import type { RoomAccessActor } from "@/lib/rooms/actors";

export {
  assertParticipantCountWithinCapacity,
  clampTokenTtlSeconds,
  getLiveKitTokenTtlCeilingSeconds,
} from "@/lib/livekit/token-limits";
export { grantsForRole } from "@/lib/livekit/grants";

/** @deprecated Prefer getLiveKitTokenTtlCeilingSeconds — kept for call-site clarity. */
export const LIVEKIT_TOKEN_TTL_SECONDS = getLiveKitTokenTtlCeilingSeconds();

export type LiveKitTokenResult = {
  token: string;
  livekitUrl: string;
  roomName: string;
  identity: string;
  displayName: string;
  role: LiveKitAppRole;
  expiresAt: number;
};

/**
 * Ensure the LiveKit room exists with the application maxParticipants limit.
 * LiveKit enforces this at the SFU (harder capacity bound than token checks alone).
 */
export async function ensureLiveKitRoom(room: Room): Promise<void> {
  const roomService = createRoomServiceClient();
  const name = toLiveKitRoomName(room.id);
  const metadata = JSON.stringify({
    applicationRoomId: room.id,
    type: room.type,
  });

  try {
    await roomService.createRoom({
      name,
      emptyTimeout: 60 * 10,
      maxParticipants: room.maxParticipants,
      metadata,
    });
    return;
  } catch (error) {
    logger.warn("livekit.create_room_retry_update", {
      roomId: room.id,
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    await roomService.updateRoomMetadata(name, metadata);
  } catch (updateError) {
    logger.error("livekit.ensure_room_failed", {
      roomId: room.id,
      error: updateError instanceof Error ? updateError.message : "unknown",
    });
    throw new AppError(
      "INTERNAL_ERROR",
      "Unable to prepare the media room. Please try again.",
      500,
    );
  }

  // Sync maxParticipants when the room is empty (SFU create options are not
  // updated by metadata alone). Soft capacity still uses DB max.
  try {
    const participants = await roomService.listParticipants(name);
    if (participants.length === 0) {
      await roomService.deleteRoom(name);
      await roomService.createRoom({
        name,
        emptyTimeout: 60 * 10,
        maxParticipants: room.maxParticipants,
        metadata,
      });
      logger.info("livekit.room_recreated_for_capacity", {
        roomId: room.id,
        maxParticipants: room.maxParticipants,
      });
    }
  } catch (syncError) {
    logger.warn("livekit.max_participants_sync_skipped", {
      roomId: room.id,
      error: syncError instanceof Error ? syncError.message : "unknown",
    });
  }
}

/**
 * Count current LiveKit participants for capacity checks.
 *
 * Limitation: this is not fully atomic under concurrent joins. Two requests can
 * both observe count < max and both receive tokens. LiveKit's room
 * `maxParticipants` provides the hard SFU-side limit.
 */
export async function getLiveKitParticipantCount(
  applicationRoomId: string,
): Promise<number> {
  const roomService = createRoomServiceClient();
  const name = toLiveKitRoomName(applicationRoomId);

  try {
    const participants = await roomService.listParticipants(name);
    return participants.length;
  } catch {
    return 0;
  }
}

export async function assertLiveKitCapacityAvailable(
  room: Room,
): Promise<void> {
  const count = await getLiveKitParticipantCount(room.id);
  assertParticipantCountWithinCapacity(count, room.maxParticipants);
}

/** Best-effort close: removes the LiveKit room and disconnects occupants. */
export async function deleteLiveKitRoom(
  applicationRoomId: string,
): Promise<void> {
  const roomService = createRoomServiceClient();
  const name = toLiveKitRoomName(applicationRoomId);

  try {
    await roomService.deleteRoom(name);
    logger.info("livekit.room_deleted", { roomId: applicationRoomId });
  } catch (error) {
    logger.warn("livekit.room_delete_skipped", {
      roomId: applicationRoomId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function createLiveKitAccessToken(input: {
  room: Room;
  actor: RoomAccessActor;
  identity: string;
  displayName: string;
  role: LiveKitAppRole;
  /** Cap token lifetime so tokens cannot outlive the meeting window. */
  ttlSeconds?: number;
}): Promise<LiveKitTokenResult> {
  const { url, apiKey, apiSecret } = getLiveKitServerConfig();
  const roomName = toLiveKitRoomName(input.room.id);
  const grants = grantsForRole(input.role);
  const secondsUntilEnd = Math.max(
    1,
    Math.floor((input.room.endTime.getTime() - Date.now()) / 1000),
  );
  const ttlSeconds = clampTokenTtlSeconds({
    requestedSeconds: input.ttlSeconds,
    secondsUntilEnd,
  });
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: input.identity,
    name: input.displayName,
    ttl: ttlSeconds,
    metadata: JSON.stringify({
      role: input.role,
      kind: input.actor.kind,
    }),
  });

  at.addGrant({
    room: roomName,
    ...grants,
  });

  const token = await at.toJwt();

  return {
    token,
    livekitUrl: url,
    roomName,
    identity: input.identity,
    displayName: input.displayName,
    role: input.role,
    expiresAt,
  };
}
