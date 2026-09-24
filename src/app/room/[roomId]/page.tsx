import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MeetingRoom } from "@/components/meeting/meeting-room";
import { RoomStatusBadge } from "@/components/rooms/room-status-badge";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { isHost, requireRoomAccess } from "@/lib/rooms/authorization";
import { getRoomById } from "@/lib/rooms/queries";
import {
  deriveRoomStatus,
  formatRoomInstant,
} from "@/lib/rooms/schedule";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  const room = await getRoomById(roomId);
  return {
    title: room ? room.title : "Room",
  };
}

function RoomGate({
  title,
  description,
  status,
  leaveHref,
  leaveLabel,
  children,
}: {
  title: string;
  description: string;
  status?: "scheduled" | "ended";
  leaveHref: string;
  leaveLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mc-fog flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-border/80 bg-surface-elevated p-6 sm:p-7">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {status ? <RoomStatusBadge status={status} /> : null}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {children}
          <Button variant="outline" asChild>
            <Link href={leaveHref}>{leaveLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(roomId)) {
    notFound();
  }

  const room = await getRoomById(roomId);
  if (!room) {
    notFound();
  }

  let access;
  try {
    access = await requireRoomAccess(roomId);
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <RoomGate
          title="Access denied"
          description="You need an invite link or membership to open this room."
          leaveHref="/dashboard"
          leaveLabel="Dashboard"
        >
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </RoomGate>
      );
    }
    throw error;
  }

  const status = deriveRoomStatus(room);
  const leaveHref =
    access.actor.kind === "guest"
      ? `/invite/${room.inviteCode}`
      : "/dashboard";
  const leaveLabel = access.actor.kind === "guest" ? "Back to invite" : "Dashboard";

  if (status === "scheduled") {
    return (
      <RoomGate
        title={room.title}
        status="scheduled"
        description={`Opens at ${formatRoomInstant(room.startTime)}. Come back with this link when it’s time.`}
        leaveHref={leaveHref}
        leaveLabel={leaveLabel}
      />
    );
  }

  if (status === "ended") {
    return (
      <RoomGate
        title="Room ended"
        status="ended"
        description={`This room ended at ${formatRoomInstant(room.endTime)}.`}
        leaveHref={leaveHref}
        leaveLabel={leaveLabel}
      />
    );
  }

  const { actor } = access;
  const host = isHost(actor);

  return (
    <MeetingRoom
      roomId={room.id}
      roomTitle={room.title}
      roomType={room.type}
      startTimeIso={room.startTime.toISOString()}
      endTimeIso={room.endTime.toISOString()}
      leaveHref={leaveHref}
      inviteCode={host ? room.inviteCode : undefined}
    />
  );
}
