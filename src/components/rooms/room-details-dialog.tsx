"use client";

import { CopyInviteButton } from "@/components/rooms/copy-invite-button";
import { RoomStatusBadge } from "@/components/rooms/room-status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DerivedRoomStatus } from "@/lib/rooms/schedule";

export type RoomDetailsData = {
  id: string;
  title: string;
  status: DerivedRoomStatus;
  startLabel: string;
  endLabel: string;
  inviteCode: string;
  hostName?: string;
  maxParticipants?: number;
};

type RoomDetailsDialogProps = {
  room: RoomDetailsData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extra footer actions (e.g. Delete). */
  footer?: React.ReactNode;
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-2.5 last:border-0">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

export function RoomDetailsDialog({
  room,
  open,
  onOpenChange,
  footer,
}: RoomDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {room ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex min-w-0 items-center gap-2 pr-2">
                <span className="truncate">{room.title}</span>
                <RoomStatusBadge
                  status={room.status}
                  className="shrink-0"
                />
              </DialogTitle>
              <DialogDescription>Meeting details</DialogDescription>
            </DialogHeader>

            <dl className="mt-1">
              <DetailRow label="Started">
                <span className="tabular-nums">{room.startLabel}</span>
              </DetailRow>
              <DetailRow label="Ended">
                <span className="tabular-nums">{room.endLabel}</span>
              </DetailRow>
              {room.hostName ? (
                <DetailRow label="Host">{room.hostName}</DetailRow>
              ) : null}
              {typeof room.maxParticipants === "number" ? (
                <DetailRow label="Seats">
                  <span className="tabular-nums">{room.maxParticipants}</span>
                </DetailRow>
              ) : null}
              <DetailRow label="Invite">
                <div className="flex items-center justify-end gap-1">
                  <code className="max-w-[8rem] truncate text-xs text-muted-foreground">
                    {room.inviteCode}
                  </code>
                  <CopyInviteButton
                    inviteCode={room.inviteCode}
                    size="icon"
                  />
                </div>
              </DetailRow>
            </dl>

            {footer ? (
              <div className="-mx-5 -mb-5 border-t border-border/80 bg-muted/25 p-4 [&_button]:w-full">
                {footer}
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
