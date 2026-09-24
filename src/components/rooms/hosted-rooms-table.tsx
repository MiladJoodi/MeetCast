"use client";

import { useActionState, useMemo, useRef, useState } from "react";

import {
  deleteRoomsAction,
  type RoomActionState,
} from "@/app/actions/rooms";
import { DeleteRoomButton } from "@/components/rooms/delete-room-button";
import {
  RoomDetailsDialog,
  type RoomDetailsData,
} from "@/components/rooms/room-details-dialog";
import { RoomRowActions } from "@/components/rooms/room-row-actions";
import { RoomStatusBadge } from "@/components/rooms/room-status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { DerivedRoomStatus } from "@/lib/rooms/schedule";
import { cn } from "@/lib/utils";

export type HostedRoomRow = {
  id: string;
  title: string;
  status: DerivedRoomStatus;
  statusLabel: string;
  startLabel: string;
  endLabel: string;
  startAt: string;
  endAt: string;
  inviteCode: string;
  maxParticipants?: number;
  visibility: "public" | "private";
  rowNumber: number;
};

type HostedRoomsTableProps = {
  rooms: HostedRoomRow[];
};

const initialState: RoomActionState = { ok: false };

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(new Date(iso));
}

function RoomSubtitle({ room }: { room: HostedRoomRow }) {
  if (room.status === "live") {
    return (
      <>
        until <span className="tabular-nums">{formatTime(room.endAt)}</span>
      </>
    );
  }
  if (room.status === "ended") {
    return <span className="tabular-nums">{room.endLabel}</span>;
  }
  return <span className="tabular-nums">{room.startLabel}</span>;
}

function toDetails(room: HostedRoomRow): RoomDetailsData {
  return {
    id: room.id,
    title: room.title,
    status: room.status,
    startLabel: room.startLabel,
    endLabel: room.endLabel,
    inviteCode: room.inviteCode,
    maxParticipants: room.maxParticipants,
  };
}

export function HostedRoomsTable({ rooms }: HostedRoomsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [detailsRoom, setDetailsRoom] = useState<RoomDetailsData | null>(null);
  const bulkFormRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    deleteRoomsAction,
    initialState,
  );

  const allIds = useMemo(() => rooms.map((room) => room.id), [rooms]);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleOne(roomId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(roomId);
      else next.delete(roomId);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(allIds) : new Set());
  }

  function openEndedDetails(room: HostedRoomRow) {
    if (room.status !== "ended") return;
    setDetailsRoom(toDetails(room));
  }

  return (
    <div className="space-y-3">
      {someSelected ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/35 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selected.size} selected
          </p>
          <form
            ref={bulkFormRef}
            action={formAction}
            className="w-full sm:w-auto"
          >
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="roomIds" value={id} />
            ))}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={() => setBulkOpen(true)}
            >
              {pending ? "Deleting…" : "Delete selected"}
            </Button>
          </form>
          <ConfirmDialog
            open={bulkOpen}
            onOpenChange={setBulkOpen}
            title="Delete rooms?"
            description={`${selected.size} room${selected.size === 1 ? "" : "s"} will be removed permanently. This cannot be undone.`}
            confirmLabel="Delete"
            confirmingLabel="Deleting…"
            pending={pending}
            destructive
            onConfirm={() => bulkFormRef.current?.requestSubmit()}
          />
        </div>
      ) : null}

      {state.message && !state.ok ? (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      {/* Mobile — same row language as /dashboard Now */}
      <div className="space-y-2.5 md:hidden">
        <label className="flex items-center gap-2.5 px-0.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-[var(--brand)]"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={(e) => toggleAll(e.target.checked)}
            aria-label="Select all on this page"
          />
          Select all
        </label>

        <ul className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
          {rooms.map((room) => {
            const isSelected = selected.has(room.id);
            const isEnded = room.status === "ended";
            return (
              <li
                key={room.id}
                className={cn(
                  "flex items-center gap-2.5 border-b border-border/70 px-3 py-3 last:border-b-0 sm:gap-3 sm:px-3.5",
                  isSelected && "bg-brand-soft/25",
                )}
              >
                <label className="flex shrink-0 items-center">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--brand)]"
                    checked={isSelected}
                    onChange={(e) => toggleOne(room.id, e.target.checked)}
                    aria-label={`Select ${room.title}`}
                  />
                </label>
                {isEnded ? (
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => openEndedDetails(room)}
                  >
                    <p className="truncate text-[0.95rem] font-semibold tracking-tight">
                      {room.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="capitalize">{room.visibility}</span>
                      {" · "}
                      <RoomSubtitle room={room} />
                    </p>
                  </button>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-semibold tracking-tight">
                      {room.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="capitalize">{room.visibility}</span>
                      {" · "}
                      <RoomSubtitle room={room} />
                    </p>
                  </div>
                )}
                <RoomRowActions
                  roomId={room.id}
                  roomTitle={room.title}
                  inviteCode={room.inviteCode}
                  status={room.status}
                  showDelete
                  onViewDetails={
                    isEnded ? () => openEndedDetails(room) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border/80 md:block">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--brand)]"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Select all on this page"
                />
              </th>
              <th className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                Meeting
              </th>
              <th className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                Schedule
              </th>
              <th className="px-3 py-2.5 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const isSelected = selected.has(room.id);
              const isLive = room.status === "live";
              const isEnded = room.status === "ended";
              return (
                <tr
                  key={room.id}
                  className={cn(
                    "border-b border-border/70 last:border-0",
                    isSelected && "bg-brand-soft/35",
                    isLive && "bg-live/5",
                    isEnded && "cursor-pointer hover:bg-muted/30",
                  )}
                  onClick={
                    isEnded
                      ? (event) => {
                          const target = event.target as HTMLElement;
                          if (
                            target.closest(
                              "button, a, input, [role='menu'], [data-slot='dialog-content']",
                            )
                          ) {
                            return;
                          }
                          openEndedDetails(room);
                        }
                      : undefined
                  }
                >
                  <td className="px-3 py-3.5 align-middle">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--brand)]"
                      checked={isSelected}
                      onChange={(e) => toggleOne(room.id, e.target.checked)}
                      aria-label={`Select ${room.title}`}
                    />
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <p className="truncate font-semibold">{room.title}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {room.visibility}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <RoomStatusBadge status={room.status} />
                  </td>
                  <td className="px-3 py-3.5 align-middle text-muted-foreground">
                    {room.status === "live" ? (
                      <span className="text-sm">
                        until{" "}
                        <span className="tabular-nums">
                          {formatTime(room.endAt)}
                        </span>
                      </span>
                    ) : room.status === "ended" ? (
                      <span className="whitespace-nowrap text-sm tabular-nums">
                        {room.endLabel}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap text-sm tabular-nums">
                        {room.startLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <div className="flex justify-end">
                      <RoomRowActions
                        roomId={room.id}
                        roomTitle={room.title}
                        inviteCode={room.inviteCode}
                        status={room.status}
                        showDelete
                        onViewDetails={
                          isEnded ? () => openEndedDetails(room) : undefined
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RoomDetailsDialog
        room={detailsRoom}
        open={detailsRoom !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsRoom(null);
        }}
        footer={
          detailsRoom ? (
            <DeleteRoomButton
              roomId={detailsRoom.id}
              roomTitle={detailsRoom.title}
              size="sm"
            />
          ) : null
        }
      />
    </div>
  );
}
