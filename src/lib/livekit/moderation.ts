import "server-only";

import {
  TrackSource,
  type ParticipantInfo,
  type ParticipantPermission,
} from "livekit-server-sdk";

import type { Room } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { LiveKitAppRole } from "@/lib/livekit/identity";
import { createRoomServiceClient } from "@/lib/livekit/room-service";
import { toLiveKitRoomName } from "@/lib/livekit/room-name";
import { logger } from "@/lib/logger";

const ALL_PUBLISH_SOURCES: TrackSource[] = [
  TrackSource.CAMERA,
  TrackSource.MICROPHONE,
  TrackSource.SCREEN_SHARE,
  TrackSource.SCREEN_SHARE_AUDIO,
];

function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("does not exist") ||
    message.includes("participant does not exist")
  );
}

async function requireLiveKitParticipant(
  applicationRoomId: string,
  identity: string,
): Promise<{ roomName: string; participant: ParticipantInfo }> {
  const roomService = createRoomServiceClient();
  const roomName = toLiveKitRoomName(applicationRoomId);

  try {
    const participant = await roomService.getParticipant(roomName, identity);
    return { roomName, participant };
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new AppError(
        "NOT_FOUND",
        "Participant is not in this meeting.",
        404,
      );
    }
    logger.error("livekit.get_participant_failed", {
      roomId: applicationRoomId,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new AppError(
      "INTERNAL_ERROR",
      "Unable to look up the participant. Please try again.",
      500,
    );
  }
}

function currentPublishSources(
  permission: ParticipantPermission | undefined,
): TrackSource[] {
  if (permission?.canPublishSources && permission.canPublishSources.length > 0) {
    return [...permission.canPublishSources];
  }
  return [...ALL_PUBLISH_SOURCES];
}

function buildPermission(
  current: ParticipantPermission | undefined,
  sources: TrackSource[],
): Partial<ParticipantPermission> {
  return {
    canSubscribe: current?.canSubscribe ?? true,
    canPublish: true,
    canPublishData: current?.canPublishData ?? true,
    canPublishSources: sources,
    canUpdateMetadata: current?.canUpdateMetadata ?? true,
    hidden: current?.hidden ?? false,
  };
}

/**
 * Mute a participant's microphone tracks and revoke microphone publish permission.
 *
 * Limitation: LiveKit cannot permanently force a browser mic off at the OS level.
 * We mute published tracks and revoke MICROPHONE from canPublishSources so the
 * participant cannot republish audio until permissions are restored (e.g. new token).
 */
export async function muteParticipantMicrophone(input: {
  room: Room;
  targetIdentity: string;
}): Promise<{ mutedTrackCount: number; alreadyMuted: boolean }> {
  const roomService = createRoomServiceClient();
  const { roomName, participant } = await requireLiveKitParticipant(
    input.room.id,
    input.targetIdentity,
  );

  const micTracks = participant.tracks.filter(
    (track) => track.source === TrackSource.MICROPHONE,
  );

  let mutedTrackCount = 0;
  let alreadyMuted = micTracks.length > 0;

  for (const track of micTracks) {
    if (track.muted) {
      continue;
    }
    alreadyMuted = false;
    try {
      await roomService.mutePublishedTrack(
        roomName,
        input.targetIdentity,
        track.sid,
        true,
      );
      mutedTrackCount += 1;
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new AppError(
          "NOT_FOUND",
          "Participant left during the mute operation.",
          404,
        );
      }
      logger.error("livekit.mute_track_failed", {
        roomId: input.room.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw new AppError(
        "INTERNAL_ERROR",
        "Unable to mute the participant.",
        500,
      );
    }
  }

  const sources = currentPublishSources(participant.permission).filter(
    (source) => source !== TrackSource.MICROPHONE,
  );

  try {
    await roomService.updateParticipant(roomName, input.targetIdentity, {
      permission: buildPermission(participant.permission, sources),
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new AppError(
        "NOT_FOUND",
        "Participant left during the mute operation.",
        404,
      );
    }
    logger.error("livekit.update_permission_mute_failed", {
      roomId: input.room.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new AppError(
      "INTERNAL_ERROR",
      "Muted tracks but could not update publish permissions.",
      500,
    );
  }

  return { mutedTrackCount, alreadyMuted: alreadyMuted && mutedTrackCount === 0 };
}

/**
 * Disable a participant's camera tracks and revoke camera publish permission.
 */
export async function disableParticipantCamera(input: {
  room: Room;
  targetIdentity: string;
}): Promise<{ disabledTrackCount: number; alreadyOff: boolean }> {
  const roomService = createRoomServiceClient();
  const { roomName, participant } = await requireLiveKitParticipant(
    input.room.id,
    input.targetIdentity,
  );

  const cameraTracks = participant.tracks.filter(
    (track) => track.source === TrackSource.CAMERA,
  );

  let disabledTrackCount = 0;
  let alreadyOff = cameraTracks.length === 0;

  for (const track of cameraTracks) {
    if (track.muted) {
      continue;
    }
    alreadyOff = false;
    try {
      await roomService.mutePublishedTrack(
        roomName,
        input.targetIdentity,
        track.sid,
        true,
      );
      disabledTrackCount += 1;
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new AppError(
          "NOT_FOUND",
          "Participant left during the camera disable operation.",
          404,
        );
      }
      logger.error("livekit.disable_camera_failed", {
        roomId: input.room.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw new AppError(
        "INTERNAL_ERROR",
        "Unable to disable the participant's camera.",
        500,
      );
    }
  }

  if (cameraTracks.every((t) => t.muted) && cameraTracks.length > 0) {
    alreadyOff = true;
  }

  const sources = currentPublishSources(participant.permission).filter(
    (source) => source !== TrackSource.CAMERA,
  );

  try {
    await roomService.updateParticipant(roomName, input.targetIdentity, {
      permission: buildPermission(participant.permission, sources),
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new AppError(
        "NOT_FOUND",
        "Participant left during the camera disable operation.",
        404,
      );
    }
    logger.error("livekit.update_permission_camera_failed", {
      roomId: input.room.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new AppError(
      "INTERNAL_ERROR",
      "Disabled camera but could not update publish permissions.",
      500,
    );
  }

  return {
    disabledTrackCount,
    alreadyOff: alreadyOff && disabledTrackCount === 0,
  };
}

/**
 * Remove a participant from the LiveKit room and revoke their current token.
 * They must obtain a new application-authorized token to rejoin.
 */
export async function removeLiveKitParticipant(input: {
  room: Room;
  targetIdentity: string;
}): Promise<void> {
  const roomService = createRoomServiceClient();
  const roomName = toLiveKitRoomName(input.room.id);

  // Confirm they are in this room first (prevents cross-room targeting).
  await requireLiveKitParticipant(input.room.id, input.targetIdentity);

  try {
    await roomService.removeParticipant(roomName, input.targetIdentity, {
      revokeTokenTs: BigInt(Math.floor(Date.now() / 1000)),
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new AppError(
        "NOT_FOUND",
        "Participant already left the meeting.",
        404,
      );
    }
    logger.error("livekit.remove_participant_failed", {
      roomId: input.room.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new AppError(
      "INTERNAL_ERROR",
      "Unable to remove the participant.",
      500,
    );
  }
}

/**
 * Sync LiveKit metadata / roomAdmin when application membership role changes.
 * Best-effort: participant may be offline.
 */
export async function syncLiveKitRoleForUser(input: {
  room: Room;
  userId: string;
  role: LiveKitAppRole;
}): Promise<void> {
  const roomService = createRoomServiceClient();
  const roomName = toLiveKitRoomName(input.room.id);
  const identity = `user:${input.userId}`;
  const canAdmin = input.role === "host" || input.role === "moderator";

  try {
    const participant = await roomService.getParticipant(roomName, identity);
    const sources = currentPublishSources(participant.permission);

    await roomService.updateParticipant(roomName, identity, {
      metadata: JSON.stringify({
        role: input.role,
        kind: "user",
      }),
      permission: {
        ...buildPermission(participant.permission, sources),
        // roomAdmin is not on ParticipantPermission in all versions —
        // metadata role is what the MeetCast UI uses; token issuance
        // remains the source of truth for roomAdmin on next join.
      },
    });

    logger.info("livekit.role_metadata_synced", {
      roomId: input.room.id,
      role: input.role,
      canAdmin,
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      // Offline — DB role applies on next token issue.
      return;
    }
    logger.warn("livekit.role_sync_failed", {
      roomId: input.room.id,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
