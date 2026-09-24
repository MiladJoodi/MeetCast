"use client";

import type { ReactNode } from "react";
import {
  useConnectionState,
  useParticipants,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

import { cn } from "@/lib/utils";

type MeetingHeaderProps = {
  roomTitle: string;
  roomType: "meeting" | "webinar";
  /** Actions aligned opposite the status row (e.g. copy invite). */
  actions?: ReactNode;
};

function connectionMeta(state: ConnectionState): {
  label: string;
  className: string;
} {
  switch (state) {
    case ConnectionState.Connected:
      return {
        label: "Connected",
        className:
          "bg-success/25 text-[color-mix(in_oklch,var(--success)_85%,white)]",
      };
    case ConnectionState.Connecting:
      return {
        label: "Connecting",
        className:
          "bg-warning/25 text-[color-mix(in_oklch,var(--warning)_90%,white)]",
      };
    case ConnectionState.Reconnecting:
    case ConnectionState.SignalReconnecting:
      return {
        label: "Reconnecting",
        className:
          "bg-warning/25 text-[color-mix(in_oklch,var(--warning)_90%,white)]",
      };
    case ConnectionState.Disconnected:
      return {
        label: "Disconnected",
        className:
          "bg-danger/25 text-[color-mix(in_oklch,var(--danger)_90%,white)]",
      };
    default:
      return {
        label: "Unknown",
        className: "bg-white/10 text-white/70",
      };
  }
}

export function MeetingHeader({
  roomTitle,
  roomType,
  actions,
}: MeetingHeaderProps) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const count = participants.length;
  const connection = connectionMeta(connectionState);

  return (
    <header className="mc-room-chrome flex shrink-0 items-center gap-3 border-b border-white/12 px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-[0.95rem] leading-tight font-semibold tracking-tight text-[var(--room-fg)]">
            {roomTitle}
          </p>
          <div className="flex min-w-0 flex-nowrap items-center gap-x-2 text-xs leading-none text-[var(--room-muted)]">
            <span className="capitalize text-white/55">{roomType}</span>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none",
                connection.className,
              )}
            >
              {connection.label}
            </span>
            <span className="tabular-nums text-white/55">
              {count} present
            </span>
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
