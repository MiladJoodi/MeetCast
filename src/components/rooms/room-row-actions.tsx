"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  CircleStop,
  Info,
  Link2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";

import { CopyInviteButton } from "@/components/rooms/copy-invite-button";
import { DeleteRoomButton } from "@/components/rooms/delete-room-button";
import { EndMeetingButton } from "@/components/rooms/end-meeting-button";
import {
  ROOM_ACTION_ICON_BTN,
  ROOM_ACTION_ICON_SIZE,
  ROOM_ACTION_STROKE,
  ROOM_ACTION_SVG,
} from "@/components/rooms/room-action-styles";
import { Button } from "@/components/ui/button";
import type { DerivedRoomStatus } from "@/lib/rooms/schedule";

type RoomRowActionsProps = {
  roomId: string;
  roomTitle: string;
  inviteCode: string;
  status: DerivedRoomStatus;
  showDelete?: boolean;
  /** Opens details (used for ended rooms). */
  onViewDetails?: () => void;
};

async function copyInvite(inviteCode: string) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    window.location.origin;
  await navigator.clipboard.writeText(`${origin}/invite/${inviteCode}`);
}

export function RoomRowActions({
  roomId,
  roomTitle,
  inviteCode,
  status,
  showDelete = false,
  onViewDetails,
}: RoomRowActionsProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const isLive = status === "live";
  const isEnded = status === "ended";
  const joinLabel = isLive ? "Join" : "Open";

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onCopy() {
    try {
      await copyInvite(inviteCode);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  const joinButton = !isEnded ? (
    <Button
      variant="ghost"
      size={ROOM_ACTION_ICON_SIZE}
      asChild
      title={joinLabel}
      className={ROOM_ACTION_ICON_BTN}
    >
      <Link
        href={`/room/${roomId}`}
        aria-label={`${joinLabel} ${roomTitle}`}
      >
        <Video className={ROOM_ACTION_SVG} strokeWidth={ROOM_ACTION_STROKE} />
      </Link>
    </Button>
  ) : null;

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      {/* Desktop: all actions as matching icon buttons */}
      <div className="hidden items-center sm:flex">
        {onViewDetails ? (
          <Button
            type="button"
            variant="ghost"
            size={ROOM_ACTION_ICON_SIZE}
            title="Details"
            aria-label={`Details for ${roomTitle}`}
            className={ROOM_ACTION_ICON_BTN}
            onClick={onViewDetails}
          >
            <Info className={ROOM_ACTION_SVG} strokeWidth={ROOM_ACTION_STROKE} />
          </Button>
        ) : null}
        {joinButton}
        {!isEnded ? (
          <>
            <CopyInviteButton inviteCode={inviteCode} size="icon" />
            {isLive ? (
              <EndMeetingButton
                roomId={roomId}
                roomTitle={roomTitle}
                size="icon"
              />
            ) : null}
            <Button
              variant="ghost"
              size={ROOM_ACTION_ICON_SIZE}
              asChild
              title="Edit"
              className={ROOM_ACTION_ICON_BTN}
            >
              <Link
                href={`/dashboard/rooms/${roomId}/edit`}
                aria-label={`Edit ${roomTitle}`}
              >
                <Pencil
                  className={ROOM_ACTION_SVG}
                  strokeWidth={ROOM_ACTION_STROKE}
                />
              </Link>
            </Button>
          </>
        ) : null}
        {showDelete ? (
          <DeleteRoomButton
            roomId={roomId}
            roomTitle={roomTitle}
            size="icon"
          />
        ) : null}
      </div>

      {/* Mobile: Join/Open icon + ⋮ for the rest */}
      <div className="flex items-center sm:hidden">
        {joinButton}
        <Button
          type="button"
          variant="ghost"
          size={ROOM_ACTION_ICON_SIZE}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="menu"
          aria-label="More actions"
          className={ROOM_ACTION_ICON_BTN}
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontal
            className={ROOM_ACTION_SVG}
            strokeWidth={ROOM_ACTION_STROKE}
          />
        </Button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            className="absolute top-full right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md"
          >
            {onViewDetails ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted/70"
                onClick={() => {
                  setOpen(false);
                  onViewDetails();
                }}
              >
                <Info className="size-4 shrink-0" aria-hidden />
                <span>Details</span>
              </button>
            ) : null}

            {!isEnded ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted/70"
                  onClick={() => {
                    void onCopy();
                  }}
                >
                  {copied ? (
                    <Check className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <Link2 className="size-4 shrink-0" aria-hidden />
                  )}
                  <span>{copied ? "Copied" : "Copy link"}</span>
                </button>

                {isLive ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                    onClick={() => {
                      setOpen(false);
                      setEndOpen(true);
                    }}
                  >
                    <CircleStop className="size-4 shrink-0" aria-hidden />
                    <span>End meeting</span>
                  </button>
                ) : null}

                <Link
                  role="menuitem"
                  href={`/dashboard/rooms/${roomId}/edit`}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/70"
                  onClick={() => setOpen(false)}
                >
                  <Pencil className="size-4 shrink-0" aria-hidden />
                  <span>Edit</span>
                </Link>
              </>
            ) : null}

            {showDelete ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                onClick={() => {
                  setOpen(false);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                <span>Delete</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isLive ? (
        <EndMeetingButton
          roomId={roomId}
          roomTitle={roomTitle}
          hideTrigger
          open={endOpen}
          onOpenChange={setEndOpen}
        />
      ) : null}

      {showDelete ? (
        <DeleteRoomButton
          roomId={roomId}
          roomTitle={roomTitle}
          hideTrigger
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      ) : null}
    </div>
  );
}
