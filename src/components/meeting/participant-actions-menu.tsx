"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { userIdFromLiveKitIdentity } from "@/lib/livekit/parse-identity";
import type { MeetingRoleLabel } from "@/components/meeting/role-utils";
import { cn } from "@/lib/utils";

export type ModeratorCapability = "none" | "moderator" | "host";

type ParticipantActionsMenuProps = {
  roomId: string;
  targetIdentity: string;
  targetRole: MeetingRoleLabel;
  displayName: string;
  capability: ModeratorCapability;
  onFeedback: (message: string, ok: boolean) => void;
};

async function postModerate(
  roomId: string,
  action: "mute" | "disable_camera" | "remove",
  targetIdentity: string,
): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`/api/rooms/${roomId}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, targetIdentity }),
  });
  const payload: unknown = await response.json().catch(() => null);
  const message =
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as { message?: string }).message === "string"
      ? (payload as { message: string }).message
      : typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error?: { message?: string } }).error?.message ===
            "string"
        ? (payload as { error: { message: string } }).error.message
        : "Moderation action failed.";

  return { ok: response.ok, message };
}

async function postRole(
  roomId: string,
  userId: string,
  role: "moderator" | "participant",
): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`/api/rooms/${roomId}/members/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role }),
  });
  const payload: unknown = await response.json().catch(() => null);
  const message =
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as { message?: string }).message === "string"
      ? (payload as { message: string }).message
      : typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error?: { message?: string } }).error?.message ===
            "string"
        ? (payload as { error: { message: string } }).error.message
        : "Role update failed.";

  return { ok: response.ok, message };
}

export function ParticipantActionsMenu({
  roomId,
  targetIdentity,
  targetRole,
  displayName,
  capability,
  onFeedback,
}: ParticipantActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = useCallback(
    async (fn: () => Promise<{ ok: boolean; message: string }>) => {
      setPending(true);
      try {
        const result = await fn();
        onFeedback(result.message, result.ok);
      } finally {
        setPending(false);
        setOpen(false);
      }
    },
    [onFeedback],
  );

  if (capability === "none" || targetRole === "host") {
    return null;
  }

  // Moderators cannot act on other moderators.
  if (capability === "moderator" && targetRole === "moderator") {
    return null;
  }

  const targetUserId = userIdFromLiveKitIdentity(targetIdentity);
  const canManageRole =
    capability === "host" &&
    targetUserId !== null &&
    (targetRole === "participant" || targetRole === "moderator");

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={`Moderation actions for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical className="size-4" aria-hidden />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for ${displayName}`}
          className={cn(
            "absolute right-0 z-30 mt-1 w-48 rounded-lg border border-border bg-background p-1 shadow-md",
          )}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            disabled={pending}
            onClick={() =>
              void run(() => postModerate(roomId, "mute", targetIdentity))
            }
          >
            Mute microphone
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            disabled={pending}
            onClick={() =>
              void run(() =>
                postModerate(roomId, "disable_camera", targetIdentity),
              )
            }
          >
            Disable camera
          </button>
          {canManageRole && targetRole === "participant" ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              disabled={pending}
              onClick={() =>
                void run(() =>
                  postRole(roomId, targetUserId, "moderator"),
                )
              }
            >
              Make moderator
            </button>
          ) : null}
          {canManageRole && targetRole === "moderator" ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              disabled={pending}
              onClick={() =>
                void run(() =>
                  postRole(roomId, targetUserId, "participant"),
                )
              }
            >
              Remove moderator
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
            disabled={pending}
            onClick={() => {
              const confirmed = window.confirm(
                `Remove ${displayName} from the meeting?`,
              );
              if (!confirmed) {
                setOpen(false);
                return;
              }
              void run(() => postModerate(roomId, "remove", targetIdentity));
            }}
          >
            Remove from meeting
          </button>
        </div>
      ) : null}
    </div>
  );
}
