import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Video } from "lucide-react";

import { DeleteAdminRoomButton, EndAdminRoomButton } from "@/components/admin/admin-room-actions";
import { BackLink } from "@/components/meetcast/back-link";
import { CopyInviteButton } from "@/components/rooms/copy-invite-button";
import { RoomStatusBadge } from "@/components/rooms/room-status-badge";
import {
  ROOM_ACTION_STROKE,
  ROOM_ACTION_SVG,
} from "@/components/rooms/room-action-styles";
import { Button } from "@/components/ui/button";
import { getAdminRoomDetail } from "@/lib/admin/queries";
import { deriveRoomStatus } from "@/lib/rooms/schedule";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { roomId } = await params;
  const detail = await getAdminRoomDetail(roomId);
  return { title: detail ? `Admin · ${detail.room.title}` : "Room" };
}

function formatWhen(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatCreated(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function MetaChip({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-surface-elevated px-3 py-2">
      <p className="text-[0.7rem] text-muted-foreground">{label}</p>
      <div className="mt-0.5 truncate text-sm font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function ActionRow({
  label,
  value,
  action,
  danger,
}: {
  label: string;
  value?: ReactNode;
  action: ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/70 py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        danger && "border-danger/20",
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-sm font-medium",
            danger ? "text-danger" : "text-foreground",
          )}
        >
          {label}
        </p>
        {value ? (
          <div className="text-sm text-muted-foreground">{value}</div>
        ) : null}
      </div>
      <div className="w-full shrink-0 sm:w-auto">{action}</div>
    </div>
  );
}

export default async function AdminRoomDetailPage({ params }: PageProps) {
  const { roomId } = await params;
  const detail = await getAdminRoomDetail(roomId);
  if (!detail) {
    notFound();
  }

  const { room, host } = detail;
  const status = deriveRoomStatus(room);
  const isLive = status === "live";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <BackLink href="/admin/rooms" label="Rooms" />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold tracking-tight">
              {room.title}
            </h2>
            <RoomStatusBadge status={status} />
          </div>
          <p className="truncate text-sm text-muted-foreground">
            Hosted by{" "}
            <Link
              href={`/admin/users/${host.id}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {host.name}
            </Link>
          </p>
        </div>
        <p className="shrink-0 pt-6 text-right text-sm text-muted-foreground">
          Created
          <span className="mt-0.5 block font-medium text-foreground">
            {formatCreated(room.createdAt)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetaChip label="Starts" value={formatWhen(room.startTime)} />
        <MetaChip label="Ends" value={formatWhen(room.endTime)} />
        <MetaChip label="Seats" value={room.maxParticipants} />
        <MetaChip
          label="Host"
          value={
            <Link
              href={`/admin/users/${host.id}`}
              className="underline-offset-4 hover:underline"
            >
              {host.name}
            </Link>
          }
        />
      </div>

      <section className="rounded-xl border border-border/80 bg-surface-elevated px-4">
        <ActionRow
          label="Open room"
          value={isLive ? "Join as admin view" : "Open room page"}
          action={
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href={`/room/${room.id}`}>
                <Video
                  className={ROOM_ACTION_SVG}
                  strokeWidth={ROOM_ACTION_STROKE}
                />
                {isLive ? "Join" : "Open"}
              </Link>
            </Button>
          }
        />
        <ActionRow
          label="Invite"
          value="Copy invite link"
          action={
            <div className="flex justify-end">
              <CopyInviteButton inviteCode={room.inviteCode} size="icon" />
            </div>
          }
        />
        {isLive ? (
          <ActionRow
            label="End meeting"
            value="Disconnect everyone and close the live window"
            action={
              <EndAdminRoomButton
                roomId={room.id}
                roomTitle={room.title}
              />
            }
          />
        ) : null}
        <ActionRow
          label="Delete room"
          value="Delete this room permanently"
          danger
          action={
            <DeleteAdminRoomButton
              roomId={room.id}
              roomTitle={room.title}
            />
          }
        />
      </section>
    </div>
  );
}
