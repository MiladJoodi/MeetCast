"use client";

import { useCallback, useRef, useState } from "react";
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Users,
  MessageSquare,
  Hand,
  SmilePlus,
} from "lucide-react";

import { useMeetingControlsCollab } from "@/components/meeting/collaboration-provider";
import { leaveMeetingRoom } from "@/components/meeting/media-cleanup";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  REACTION_EMOJIS,
  type ReactionEmoji,
} from "@/lib/collaboration/protocol";
import { cn } from "@/lib/utils";

type MeetingControlsProps = {
  onLeave: () => void;
  participantsOpen: boolean;
  onToggleParticipants: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
};

function mediaErrorMessage(
  error: unknown,
  kind: "camera" | "microphone" | "screen",
): string {
  if (error instanceof Error) {
    const name = error.name;
    const message = error.message.toLowerCase();

    if (
      kind === "screen" &&
      (name === "NotAllowedError" ||
        message.includes("permission") ||
        message.includes("denied") ||
        message.includes("cancel"))
    ) {
      return "Screen sharing was cancelled or blocked by the browser.";
    }

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      if (kind === "camera") {
        return "Camera permission denied. You can still join with audio only.";
      }
      if (kind === "microphone") {
        return "Microphone permission denied. You can still view the meeting.";
      }
      return "Screen sharing permission denied.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return kind === "camera"
        ? "No camera was found on this device."
        : kind === "microphone"
          ? "No microphone was found on this device."
          : "Screen sharing is not available on this device.";
    }
    if (name === "NotReadableError") {
      return kind === "camera"
        ? "Camera is in use by another application."
        : kind === "microphone"
          ? "Microphone is in use by another application."
          : "Unable to capture the screen.";
    }
    if (name === "NotSupportedError") {
      return "Screen sharing is not supported in this browser.";
    }
  }
  if (kind === "screen") {
    return "Unable to share your screen.";
  }
  return kind === "camera"
    ? "Unable to access the camera."
    : "Unable to access the microphone.";
}

const REACTION_LABELS: Record<ReactionEmoji, string> = {
  "👍": "Thumbs up",
  "❤️": "Heart",
  "😂": "Laughing",
  "👏": "Clap",
  "🎉": "Celebration",
};

export function MeetingControls({
  onLeave,
  participantsOpen,
  onToggleParticipants,
  chatOpen,
  onToggleChat,
}: MeetingControlsProps) {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const { connected, localHandRaised, setHandRaised, sendReaction } =
    useMeetingControlsCollab();
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [collabError, setCollabError] = useState<string | null>(null);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pending, setPending] = useState<
    "mic" | "cam" | "screen" | "leave" | "hand" | null
  >(null);
  const leavePending = useRef(false);

  const toggleMicrophone = useCallback(async () => {
    setPending("mic");
    setMediaError(null);
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      setMediaError(mediaErrorMessage(error, "microphone"));
    } finally {
      setPending(null);
    }
  }, [isMicrophoneEnabled, localParticipant]);

  const toggleCamera = useCallback(async () => {
    setPending("cam");
    setMediaError(null);
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (error) {
      setMediaError(mediaErrorMessage(error, "camera"));
    } finally {
      setPending(null);
    }
  }, [isCameraEnabled, localParticipant]);

  const toggleScreenShare = useCallback(async () => {
    setPending("screen");
    setMediaError(null);
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (error) {
      setMediaError(mediaErrorMessage(error, "screen"));
    } finally {
      setPending(null);
    }
  }, [isScreenShareEnabled, localParticipant]);

  const toggleHand = useCallback(async () => {
    setPending("hand");
    setCollabError(null);
    const ok = await setHandRaised(!localHandRaised);
    if (!ok) {
      setCollabError(
        connected
          ? "Could not update raised hand. Try again."
          : "Unavailable while disconnected.",
      );
    }
    setPending(null);
  }, [connected, localHandRaised, setHandRaised]);

  const onReact = useCallback(
    async (emoji: ReactionEmoji) => {
      setCollabError(null);
      const ok = await sendReaction(emoji);
      if (!ok) {
        setCollabError(
          connected
            ? "Reaction was rate-limited or failed to send."
            : "Unavailable while disconnected.",
        );
      }
      setReactionsOpen(false);
    },
    [connected, sendReaction],
  );

  const confirmLeave = useCallback(async () => {
    if (leavePending.current) return;
    leavePending.current = true;
    setPending("leave");
    try {
      if (localHandRaised) {
        await setHandRaised(false).catch(() => undefined);
      }
      await leaveMeetingRoom(room, localParticipant);
    } finally {
      leavePending.current = false;
      setPending(null);
      setLeaveOpen(false);
      onLeave();
    }
  }, [localHandRaised, localParticipant, onLeave, room, setHandRaised]);

  const core =
    "size-11 rounded-xl border border-white/20 bg-white/18 text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.12)] hover:bg-white/28 hover:text-white disabled:opacity-40";
  const tool =
    "size-10 rounded-xl border border-white/18 bg-white/10 text-white/85 hover:bg-white/18 hover:text-white disabled:opacity-40";

  return (
    <div className="mc-room-chrome border-t border-white/10 px-3 py-3 safe-pb">
      {mediaError || collabError ? (
        <p
          role="alert"
          className="mx-auto mb-2 max-w-3xl text-center text-sm text-danger"
        >
          {mediaError ?? collabError}
        </p>
      ) : null}

      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-2xl border border-white/12 bg-white/10 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className={cn(
                core,
                !isMicrophoneEnabled &&
                  "border-danger/50 bg-danger/40 text-white hover:bg-danger/50 hover:text-white",
              )}
              aria-label={
                isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
              }
              aria-pressed={isMicrophoneEnabled}
              disabled={!connected || pending !== null}
              onClick={() => void toggleMicrophone()}
            >
              {isMicrophoneEnabled ? (
                <Mic className="size-5" aria-hidden />
              ) : (
                <MicOff className="size-5" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className={cn(
                core,
                !isCameraEnabled &&
                  "border-danger/50 bg-danger/40 text-white hover:bg-danger/50 hover:text-white",
              )}
              aria-label={
                isCameraEnabled ? "Turn camera off" : "Turn camera on"
              }
              aria-pressed={isCameraEnabled}
              disabled={!connected || pending !== null}
              onClick={() => void toggleCamera()}
            >
              {isCameraEnabled ? (
                <Video className="size-5" aria-hidden />
              ) : (
                <VideoOff className="size-5" aria-hidden />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                tool,
                isScreenShareEnabled &&
                  "border-brand/55 bg-brand/35 text-white",
              )}
              aria-label={
                isScreenShareEnabled ? "Stop sharing screen" : "Share screen"
              }
              aria-pressed={isScreenShareEnabled}
              disabled={
                (!connected && !isScreenShareEnabled) || pending !== null
              }
              onClick={() => void toggleScreenShare()}
            >
              {isScreenShareEnabled ? (
                <MonitorOff className="size-4" aria-hidden />
              ) : (
                <Monitor className="size-4" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                tool,
                localHandRaised &&
                  "border-warning/55 bg-warning/30 text-warning",
              )}
              aria-label={localHandRaised ? "Lower hand" : "Raise hand"}
              aria-pressed={localHandRaised}
              disabled={!connected || pending !== null}
              onClick={() => void toggleHand()}
            >
              <Hand className="size-4" aria-hidden />
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  tool,
                  reactionsOpen && "bg-white/22 text-white",
                )}
                aria-label="Send reaction"
                aria-expanded={reactionsOpen}
                aria-haspopup="menu"
                disabled={!connected || pending === "leave"}
                onClick={() => setReactionsOpen((open) => !open)}
              >
                <SmilePlus className="size-4" aria-hidden />
              </Button>
              {reactionsOpen ? (
                <div
                  role="menu"
                  aria-label="Reactions"
                  className="absolute bottom-full left-0 z-30 mb-2 flex gap-0.5 rounded-xl border border-white/12 bg-[var(--room-chrome)] p-1 shadow-lg"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      role="menuitem"
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-lg text-base text-[var(--room-fg)] hover:bg-white/10"
                      aria-label={REACTION_LABELS[emoji]}
                      onClick={() => void onReact(emoji)}
                    >
                      <span aria-hidden>{emoji}</span>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                tool,
                chatOpen && "bg-white/22 text-white",
              )}
              aria-label={chatOpen ? "Hide chat" : "Show chat"}
              aria-pressed={chatOpen}
              aria-controls="meeting-chat-panel"
              disabled={pending === "leave"}
              onClick={onToggleChat}
            >
              <MessageSquare className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                tool,
                participantsOpen && "bg-white/22 text-white",
              )}
              aria-label={
                participantsOpen ? "Hide participants" : "Show participants"
              }
              aria-pressed={participantsOpen}
              aria-controls="meeting-participant-panel"
              disabled={pending === "leave"}
              onClick={onToggleParticipants}
            >
              <Users className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 gap-2 rounded-xl border border-danger/55 bg-danger/35 px-3.5 text-sm font-medium text-white hover:bg-danger/45 hover:text-white"
          aria-label="Leave meeting"
          disabled={pending === "leave"}
          onClick={() => setLeaveOpen(true)}
        >
          <PhoneOff className="size-4" aria-hidden />
          Leave
        </Button>
      </div>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave meeting?"
        description={
          isScreenShareEnabled
            ? "You are sharing your screen. Leaving will stop the share and disconnect you."
            : "You’ll leave this meeting. You can rejoin with the invite while it’s live."
        }
        confirmLabel="Leave"
        confirmingLabel="Leaving…"
        pending={pending === "leave"}
        destructive
        onConfirm={() => void confirmLeave()}
      />
    </div>
  );
}
