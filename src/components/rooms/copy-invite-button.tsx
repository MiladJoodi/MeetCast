"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";

import {
  ROOM_ACTION_ICON_BTN,
  ROOM_ACTION_ICON_SIZE,
  ROOM_ACTION_STROKE,
  ROOM_ACTION_SVG,
} from "@/components/rooms/room-action-styles";
import { Button } from "@/components/ui/button";

type CopyInviteButtonProps = {
  inviteCode: string;
  size?: "default" | "sm" | "icon";
  /** Dark meeting chrome — high-contrast control. */
  tone?: "default" | "room";
};

export function CopyInviteButton({
  inviteCode,
  size = "sm",
  tone = "default",
}: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const iconOnly = size === "icon";
  const roomTone = tone === "room";

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function onCopy() {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      window.location.origin;
    const inviteUrl = `${origin}/invite/${inviteCode}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant={roomTone ? "outline" : "ghost"}
        size={ROOM_ACTION_ICON_SIZE}
        onClick={onCopy}
        aria-label={copied ? "Invite link copied" : "Copy invite link"}
        title={copied ? "Copied" : "Copy link"}
        className={
          roomTone
            ? "border-white/30 bg-white/12 text-white hover:border-white/45 hover:bg-white/20 hover:text-white"
            : ROOM_ACTION_ICON_BTN
        }
      >
        {copied ? (
          <Check className={ROOM_ACTION_SVG} strokeWidth={ROOM_ACTION_STROKE} />
        ) : (
          <Link2 className={ROOM_ACTION_SVG} strokeWidth={ROOM_ACTION_STROKE} />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onCopy}
      className={
        roomTone
          ? "gap-1.5 border-white/30 bg-white/12 text-white hover:border-white/45 hover:bg-white/20 hover:text-white"
          : "gap-1.5"
      }
    >
      {copied ? (
        <Check className={ROOM_ACTION_SVG} strokeWidth={ROOM_ACTION_STROKE} />
      ) : (
        <Link2 className={ROOM_ACTION_SVG} strokeWidth={ROOM_ACTION_STROKE} />
      )}
      {copied ? "Copied" : "Copy invite link"}
    </Button>
  );
}
