"use client";

import { memo, useEffect, useState } from "react";
import {
  VideoTrack,
  isTrackReference,
  useIsMuted,
  useIsSpeaking,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ParticipantEvent, type Participant } from "livekit-client";
import { Hand, MicOff, VideoOff } from "lucide-react";

import { displayNameForParticipant } from "@/components/meeting/grid-utils";
import { cn } from "@/lib/utils";

type ParticipantTileProps = {
  trackRef: TrackReferenceOrPlaceholder;
  isLocal: boolean;
  handRaised?: boolean;
};

function useMicrophoneMuted(participant: Participant): boolean {
  const [muted, setMuted] = useState(!participant.isMicrophoneEnabled);

  useEffect(() => {
    const sync = () => {
      setMuted(!participant.isMicrophoneEnabled);
    };
    sync();
    participant.on(ParticipantEvent.TrackMuted, sync);
    participant.on(ParticipantEvent.TrackUnmuted, sync);
    participant.on(ParticipantEvent.TrackSubscribed, sync);
    participant.on(ParticipantEvent.TrackUnsubscribed, sync);
    participant.on(ParticipantEvent.LocalTrackPublished, sync);
    participant.on(ParticipantEvent.LocalTrackUnpublished, sync);
    participant.on(ParticipantEvent.TrackPublished, sync);
    participant.on(ParticipantEvent.TrackUnpublished, sync);
    return () => {
      participant.off(ParticipantEvent.TrackMuted, sync);
      participant.off(ParticipantEvent.TrackUnmuted, sync);
      participant.off(ParticipantEvent.TrackSubscribed, sync);
      participant.off(ParticipantEvent.TrackUnsubscribed, sync);
      participant.off(ParticipantEvent.LocalTrackPublished, sync);
      participant.off(ParticipantEvent.LocalTrackUnpublished, sync);
      participant.off(ParticipantEvent.TrackPublished, sync);
      participant.off(ParticipantEvent.TrackUnpublished, sync);
    };
  }, [participant]);

  return muted;
}

function ParticipantTileComponent({
  trackRef,
  isLocal,
  handRaised = false,
}: ParticipantTileProps) {
  const isCameraMuted = useIsMuted(trackRef);
  const isMicMuted = useMicrophoneMuted(trackRef.participant);
  const isSpeaking = useIsSpeaking(trackRef.participant);
  const name = displayNameForParticipant(
    trackRef.participant.name,
    trackRef.participant.identity,
  );
  const hasVideo =
    isTrackReference(trackRef) &&
    !isCameraMuted &&
    Boolean(trackRef.publication?.track);

  return (
    <article
      className={cn(
        "mc-room-tile relative h-full min-h-0 min-w-0 w-full overflow-hidden rounded-xl transition-[box-shadow] duration-150",
        isSpeaking
          ? "shadow-[inset_0_0_0_2px_var(--speaking)]"
          : isLocal
            ? "shadow-[inset_0_0_0_1px_oklch(1_0_0/0.22)]"
            : "shadow-[inset_0_0_0_1px_oklch(1_0_0/0.08)]",
      )}
      aria-label={`${name}${isLocal ? " (you)" : ""}${isSpeaking ? ", speaking" : ""}`}
    >
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={isLocal ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--room-muted)]">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/10 text-base font-semibold tracking-tight text-[var(--room-fg)]">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--room-muted)]">
            <VideoOff className="size-3" aria-hidden />
            Camera off
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-black/60 px-1.5 py-0.5">
          <p className="truncate text-[0.6875rem] font-medium text-white">
            {name}
            {isLocal ? " · you" : ""}
          </p>
          {isSpeaking ? (
            <span className="shrink-0 text-[0.5625rem] font-medium text-[var(--speaking)]">
              Speaking
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {handRaised ? (
            <span
              className="rounded-md bg-black/60 p-1 text-warning"
              aria-label="Hand raised"
            >
              <Hand className="size-3" aria-hidden />
            </span>
          ) : null}
          {isMicMuted ? (
            <span
              className="rounded-md bg-black/60 p-1 text-danger"
              aria-label="Muted"
            >
              <MicOff className="size-3" aria-hidden />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export const ParticipantTile = memo(ParticipantTileComponent);
