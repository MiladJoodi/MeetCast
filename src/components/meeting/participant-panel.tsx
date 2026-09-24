"use client";

import { memo, useCallback, useEffect, useState } from "react";
import {
  useLocalParticipant,
  useParticipants,
} from "@livekit/components-react";
import { ParticipantEvent, type Participant } from "livekit-client";
import { Hand, Mic, MicOff, Monitor, Video, VideoOff, X } from "lucide-react";

import { useRaisedHandsOnly } from "@/components/meeting/collaboration-provider";
import {
  ParticipantActionsMenu,
  type ModeratorCapability,
} from "@/components/meeting/participant-actions-menu";
import { displayNameForParticipant } from "@/components/meeting/grid-utils";
import { useParticipantRole } from "@/components/meeting/role-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ParticipantPanelProps = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  capability: ModeratorCapability;
};

function useParticipantMediaState(participant: Participant) {
  const [micOn, setMicOn] = useState(participant.isMicrophoneEnabled);
  const [camOn, setCamOn] = useState(participant.isCameraEnabled);
  const [screenOn, setScreenOn] = useState(participant.isScreenShareEnabled);

  useEffect(() => {
    const sync = () => {
      setMicOn(participant.isMicrophoneEnabled);
      setCamOn(participant.isCameraEnabled);
      setScreenOn(participant.isScreenShareEnabled);
    };
    sync();
    participant.on(ParticipantEvent.TrackMuted, sync);
    participant.on(ParticipantEvent.TrackUnmuted, sync);
    participant.on(ParticipantEvent.TrackPublished, sync);
    participant.on(ParticipantEvent.TrackUnpublished, sync);
    participant.on(ParticipantEvent.LocalTrackPublished, sync);
    participant.on(ParticipantEvent.LocalTrackUnpublished, sync);
    participant.on(ParticipantEvent.TrackSubscribed, sync);
    participant.on(ParticipantEvent.TrackUnsubscribed, sync);
    return () => {
      participant.off(ParticipantEvent.TrackMuted, sync);
      participant.off(ParticipantEvent.TrackUnmuted, sync);
      participant.off(ParticipantEvent.TrackPublished, sync);
      participant.off(ParticipantEvent.TrackUnpublished, sync);
      participant.off(ParticipantEvent.LocalTrackPublished, sync);
      participant.off(ParticipantEvent.LocalTrackUnpublished, sync);
      participant.off(ParticipantEvent.TrackSubscribed, sync);
      participant.off(ParticipantEvent.TrackUnsubscribed, sync);
    };
  }, [participant]);

  return { micOn, camOn, screenOn };
}

const ParticipantRow = memo(function ParticipantRow({
  participant,
  isLocal,
  handRaised,
  roomId,
  capability,
  onFeedback,
}: {
  participant: Participant;
  isLocal: boolean;
  handRaised: boolean;
  roomId: string;
  capability: ModeratorCapability;
  onFeedback: (message: string, ok: boolean) => void;
}) {
  const { micOn, camOn, screenOn } = useParticipantMediaState(participant);
  const name = displayNameForParticipant(participant.name, participant.identity);
  const role = useParticipantRole(participant);

  return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--room-fg)]">
          {name}
          {isLocal ? " (you)" : ""}
        </p>
        <p className="text-[0.6875rem] capitalize text-[var(--room-muted)]">
          {role}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-[var(--room-muted)]">
        {handRaised ? (
          <Hand className="size-3.5 text-warning" aria-label="Hand raised" />
        ) : null}
        {screenOn ? (
          <Monitor
            className="size-3.5 text-brand"
            aria-label="Sharing screen"
          />
        ) : null}
        <span aria-label={micOn ? "Microphone on" : "Muted"}>
          {micOn ? (
            <Mic className="size-3.5" aria-hidden />
          ) : (
            <MicOff className="size-3.5" aria-hidden />
          )}
        </span>
        <span aria-label={camOn ? "Camera on" : "Camera off"}>
          {camOn ? (
            <Video className="size-3.5" aria-hidden />
          ) : (
            <VideoOff className="size-3.5" aria-hidden />
          )}
        </span>
        {!isLocal ? (
          <ParticipantActionsMenu
            roomId={roomId}
            targetIdentity={participant.identity}
            targetRole={role}
            displayName={name}
            capability={capability}
            onFeedback={onFeedback}
          />
        ) : null}
      </div>
    </li>
  );
});

export function ParticipantPanel({
  open,
  onClose,
  roomId,
  capability,
}: ParticipantPanelProps) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { raisedHands } = useRaisedHandsOnly();
  const [feedback, setFeedback] = useState<{
    message: string;
    ok: boolean;
  } | null>(null);

  const onFeedback = useCallback((message: string, ok: boolean) => {
    setFeedback({ message, ok });
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  return (
    <>
      <button
        type="button"
        aria-label="Close participants"
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="meeting-participant-panel"
        aria-label="Participants"
        aria-hidden={!open}
        className={cn(
          "mc-room-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 transition-transform duration-200 md:static md:z-auto md:max-w-none md:w-72 md:shrink-0",
          open ? "translate-x-0" : "translate-x-full md:hidden",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Participants
            </h2>
            <p className="text-[0.6875rem] text-[var(--room-muted)]">
              {participants.length} in the meeting
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[var(--room-muted)] hover:bg-white/10 hover:text-[var(--room-fg)]"
            aria-label="Close participants panel"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        {feedback ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "border-b border-white/10 px-3 py-2 text-xs",
              feedback.ok ? "text-[var(--room-muted)]" : "text-danger",
            )}
          >
            {feedback.message}
          </p>
        ) : null}

        <ul className="flex-1 overflow-y-auto p-1.5" role="list">
          {participants.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-[var(--room-muted)]">
              No one else is here yet.
            </li>
          ) : (
            participants.map((participant) => (
              <ParticipantRow
                key={participant.identity}
                participant={participant}
                isLocal={participant.identity === localParticipant.identity}
                handRaised={raisedHands.has(participant.identity)}
                roomId={roomId}
                capability={capability}
                onFeedback={onFeedback}
              />
            ))
          )}
        </ul>
      </aside>
    </>
  );
}
