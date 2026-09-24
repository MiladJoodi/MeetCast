import type { LocalParticipant, Room } from "livekit-client";
import { Track } from "livekit-client";

const LOCAL_MEDIA_SOURCES = [
  Track.Source.Camera,
  Track.Source.Microphone,
  Track.Source.ScreenShare,
  Track.Source.ScreenShareAudio,
] as const;

/**
 * Stop local capture tracks synchronously where possible, then disable publications.
 * Safe to call multiple times.
 */
export async function stopLocalMedia(
  localParticipant: LocalParticipant,
): Promise<void> {
  for (const source of LOCAL_MEDIA_SOURCES) {
    const publication = localParticipant.getTrackPublication(source);
    publication?.track?.stop();
  }

  await Promise.allSettled([
    localParticipant.setScreenShareEnabled(false),
    localParticipant.setCameraEnabled(false),
    localParticipant.setMicrophoneEnabled(false),
  ]);
}

/**
 * Full leave cleanup: stop media then disconnect from LiveKit.
 */
export async function leaveMeetingRoom(
  room: Room,
  localParticipant: LocalParticipant,
  options?: { timeoutMs?: number },
): Promise<void> {
  await stopLocalMedia(localParticipant);
  const timeoutMs = options?.timeoutMs ?? 8_000;
  try {
    await Promise.race([
      room.disconnect(true),
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, timeoutMs);
      }),
    ]);
  } catch {
    // Already disconnected or tearing down.
  }
}
