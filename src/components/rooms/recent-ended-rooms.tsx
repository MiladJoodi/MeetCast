"use client";

import { useState } from "react";

import {
  RoomDetailsDialog,
  type RoomDetailsData,
} from "@/components/rooms/room-details-dialog";
import { RoomStatusBadge } from "@/components/rooms/room-status-badge";

type EndedRoomItem = RoomDetailsData;

type RecentEndedRoomsProps = {
  rooms: EndedRoomItem[];
};

export function RecentEndedRooms({ rooms }: RecentEndedRoomsProps) {
  const [selected, setSelected] = useState<EndedRoomItem | null>(null);

  if (rooms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No finished meetings.</p>
    );
  }

  return (
    <>
      <ul className="overflow-hidden rounded-xl border border-border/70 bg-surface-elevated/80">
        {rooms.map((room) => (
          <li key={`recent-${room.id}`} className="border-b border-border/60 last:border-b-0">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
              onClick={() => setSelected(room)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <p className="truncate text-[0.95rem] font-semibold text-foreground">
                  {room.title}
                </p>
                <RoomStatusBadge status={room.status} className="shrink-0" />
              </div>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {room.endLabel}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <RoomDetailsDialog
        room={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
