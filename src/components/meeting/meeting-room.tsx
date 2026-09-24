"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import {
  DisconnectReason,
  Track,
} from "livekit-client";

import { ChatPanel } from "@/components/meeting/chat-panel";
import { CollaborationProvider } from "@/components/meeting/collaboration-provider";
import { ConnectionBanner } from "@/components/meeting/connection-banner";
import { MeetingCleanup } from "@/components/meeting/meeting-cleanup";
import { MeetingControls } from "@/components/meeting/meeting-controls";
import { MeetingHeader } from "@/components/meeting/meeting-header";
import { MeetingScheduleLifecycle } from "@/components/meeting/meeting-schedule-lifecycle";
import type { ModeratorCapability } from "@/components/meeting/participant-actions-menu";
import { ParticipantGrid } from "@/components/meeting/participant-grid";
import { ParticipantPanel } from "@/components/meeting/participant-panel";
import { ReactionOverlay } from "@/components/meeting/reaction-overlay";
import { useParticipantRole } from "@/components/meeting/role-utils";
import { ScreenShareStage } from "@/components/meeting/screen-share-stage";
import { CopyInviteButton } from "@/components/rooms/copy-invite-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TokenResponse = {
  token: string;
  livekitUrl: string;
  roomName: string;
  identity: string;
  displayName: string;
  role: string;
  expiresAt?: number;
};

type MeetingRoomProps = {
  roomId: string;
  roomTitle: string;
  roomType: "meeting" | "webinar";
  startTimeIso: string;
  endTimeIso: string;
  leaveHref?: string;
  inviteCode?: string;
};

function capabilityFromRole(role: string): ModeratorCapability {
  if (role === "host") {
    return "host";
  }
  if (role === "moderator") {
    return "moderator";
  }
  return "none";
}

/** Prefer live metadata role so promote/demote applies without reconnect. */
function useLiveModeratorCapability(
  fallback: ModeratorCapability,
): ModeratorCapability {
  const { localParticipant } = useLocalParticipant();
  const role = useParticipantRole(localParticipant);
  const fromMetadata = capabilityFromRole(role);
  // Host from token should not be downgraded if metadata briefly lags.
  if (fallback === "host" || fromMetadata === "host") {
    return "host";
  }
  // Prefer metadata when present so demote takes effect immediately.
  if (localParticipant.metadata) {
    return fromMetadata;
  }
  return fallback;
}

function MeetingMainArea() {
  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );
  const hasScreenShare = screenTracks.length > 0;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ScreenShareStage />
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          hasScreenShare && "max-h-[40%] sm:max-h-[35%]",
        )}
      >
        <ParticipantGrid />
        <ReactionOverlay />
      </div>
    </div>
  );
}

function MeetingSession({
  roomId,
  roomTitle,
  roomType,
  leaveHref,
  inviteCode,
  capability,
  onRetryConnection,
  onMeetingEnded,
  startTimeIso,
  endTimeIso,
}: {
  roomId: string;
  roomTitle: string;
  roomType: "meeting" | "webinar";
  leaveHref: string;
  inviteCode?: string;
  capability: ModeratorCapability;
  onRetryConnection: () => void;
  onMeetingEnded: () => void;
  startTimeIso: string;
  endTimeIso: string;
}) {
  const router = useRouter();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const liveCapability = useLiveModeratorCapability(capability);

  const onLeave = useCallback(() => {
    router.push(leaveHref);
  }, [leaveHref, router]);

  const headerActions = inviteCode ? (
    <CopyInviteButton inviteCode={inviteCode} size="sm" tone="room" />
  ) : null;

  return (
    <CollaborationProvider>
      <MeetingCleanup />
      <MeetingScheduleLifecycle
        startTimeIso={startTimeIso}
        endTimeIso={endTimeIso}
        leaveHref={leaveHref}
        onMeetingEnded={onMeetingEnded}
      />
      <div className="mc-room fixed inset-0 z-40 flex flex-col overflow-hidden overscroll-none">
        <MeetingHeader
          roomTitle={roomTitle}
          roomType={roomType}
          actions={headerActions}
        />

        <ConnectionBanner onRetry={onRetryConnection} />

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <MeetingMainArea />
          <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
          <ParticipantPanel
            open={participantsOpen}
            onClose={() => setParticipantsOpen(false)}
            roomId={roomId}
            capability={liveCapability}
          />
        </div>

        <RoomAudioRenderer />

        <MeetingControls
          onLeave={onLeave}
          participantsOpen={participantsOpen}
          onToggleParticipants={() => {
            setParticipantsOpen((open) => !open);
            if (!participantsOpen) {
              setChatOpen(false);
            }
          }}
          chatOpen={chatOpen}
          onToggleChat={() => {
            setChatOpen((open) => !open);
            if (!chatOpen) {
              setParticipantsOpen(false);
            }
          }}
        />
      </div>
    </CollaborationProvider>
  );
}

function RemovedFromMeeting({ leaveHref }: { leaveHref: string }) {
  return (
    <div className="mc-fog flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/80 bg-surface-elevated p-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight">
          Removed from meeting
        </h1>
        <p role="status" className="text-sm text-muted-foreground">
          A host or moderator removed you from this meeting.
        </p>
        <Button asChild>
          <Link href={leaveHref}>Continue</Link>
        </Button>
      </div>
    </div>
  );
}

function MeetingEndedView({ leaveHref }: { leaveHref: string }) {
  return (
    <div className="mc-fog flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/80 bg-surface-elevated p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Meeting ended</h1>
        <p role="status" className="text-sm text-muted-foreground">
          The scheduled end time was reached. You are still signed in to
          MeetCast.
        </p>
        <Button asChild>
          <Link href={leaveHref}>Continue</Link>
        </Button>
      </div>
    </div>
  );
}

export function MeetingRoom({
  roomId,
  roomTitle,
  roomType,
  startTimeIso,
  endTimeIso,
  leaveHref = "/dashboard",
  inviteCode,
}: MeetingRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [localRole, setLocalRole] = useState<string>("participant");
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionKey, setSessionKey] = useState(0);
  const [removed, setRemoved] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  const retryConnection = useCallback(() => {
    if (removed || meetingEnded) {
      return;
    }
    setToken(null);
    setServerUrl(null);
    setTokenExpiresAt(null);
    setError(null);
    setLoading(true);
    setSessionKey((k) => k + 1);
  }, [meetingEnded, removed]);

  /** Refresh JWT in place without remounting LiveKitRoom (avoids A/V disconnect). */
  const softRefreshToken = useCallback(async () => {
    if (removed || meetingEnded) {
      return;
    }
    const endMs = new Date(endTimeIso).getTime();
    if (endMs - Date.now() <= 5_000) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        return;
      }
      const data = payload as TokenResponse;
      setToken(data.token);
      setServerUrl(data.livekitUrl);
      setLocalRole(data.role);
      setTokenExpiresAt(
        typeof data.expiresAt === "number" ? data.expiresAt : null,
      );
    } catch {
      // Keep existing token; hard retry remains available via Try again.
    } finally {
      window.clearTimeout(timeout);
    }
  }, [endTimeIso, meetingEnded, removed, roomId]);

  const onMeetingEnded = useCallback(() => {
    setMeetingEnded(true);
    setToken(null);
    setServerUrl(null);
    setTokenExpiresAt(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (meetingEnded || removed) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    async function fetchToken() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
          signal: controller.signal,
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error?: { message?: string } }).error
              ?.message === "string"
              ? (payload as { error: { message: string } }).error.message
              : "Unable to join the meeting.";
          if (!cancelled) {
            setError(message);
            setLoading(false);
          }
          return;
        }

        const data = payload as TokenResponse;
        if (!cancelled) {
          setToken(data.token);
          setServerUrl(data.livekitUrl);
          setLocalRole(data.role);
          setTokenExpiresAt(
            typeof data.expiresAt === "number" ? data.expiresAt : null,
          );
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const aborted =
            err instanceof DOMException && err.name === "AbortError";
          setError(
            aborted
              ? "Timed out while preparing the meeting. Please try again."
              : "Unable to join the meeting. Please try again.",
          );
          setLoading(false);
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void fetchToken();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [meetingEnded, removed, roomId, sessionKey]);

  // Soft-refresh token before JWT expiry so long meetings stay connected.
  useEffect(() => {
    if (!tokenExpiresAt || removed || meetingEnded) {
      return;
    }
    const refreshIn = tokenExpiresAt - Date.now() - 90_000;
    // Defer soft refresh to a timer so we never setState synchronously in the effect.
    const delay = refreshIn > 0 ? refreshIn : 0;
    if (delay === 0 && tokenExpiresAt - Date.now() <= 5_000) {
      return;
    }
    const timer = window.setTimeout(() => {
      void softRefreshToken();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [meetingEnded, removed, softRefreshToken, tokenExpiresAt]);

  const onDisconnected = useCallback(
    (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        setRemoved(true);
        setToken(null);
        setServerUrl(null);
        setTokenExpiresAt(null);
      }
    },
    [],
  );

  const onRoomError = useCallback((err: Error) => {
    setError(err.message || "A meeting connection error occurred.");
  }, []);

  if (removed) {
    return <RemovedFromMeeting leaveHref={leaveHref} />;
  }

  if (meetingEnded) {
    return <MeetingEndedView leaveHref={leaveHref} />;
  }

  if (loading) {
    return (
      <div className="mc-fog flex min-h-[50vh] flex-1 items-center justify-center text-sm text-muted-foreground">
        Preparing meeting…
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="mc-fog flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/80 bg-surface-elevated p-6 text-center">
          <p role="alert" className="text-sm text-destructive">
            {error ?? "Unable to start the meeting."}
          </p>
          <Button type="button" onClick={retryConnection}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={sessionKey}
      token={token}
      serverUrl={serverUrl}
      connect
      audio={false}
      video={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
      onDisconnected={onDisconnected}
      onError={onRoomError}
      className="flex min-h-0 flex-1 flex-col"
    >
      <MeetingSession
        roomId={roomId}
        roomTitle={roomTitle}
        roomType={roomType}
        leaveHref={leaveHref}
        inviteCode={inviteCode}
        startTimeIso={startTimeIso}
        endTimeIso={endTimeIso}
        capability={capabilityFromRole(localRole)}
        onRetryConnection={retryConnection}
        onMeetingEnded={onMeetingEnded}
      />
    </LiveKitRoom>
  );
}
