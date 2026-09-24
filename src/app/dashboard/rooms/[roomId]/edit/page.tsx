import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video } from "lucide-react";

import { EmptyState } from "@/components/meetcast/empty-state";
import { BackLink } from "@/components/meetcast/back-link";
import { DeleteRoomButton } from "@/components/rooms/delete-room-button";
import { EditRoomForm } from "@/components/rooms/edit-room-form";
import { MemberRoleManager } from "@/components/rooms/member-role-manager";
import {
  ROOM_ACTION_ICON_BTN,
  ROOM_ACTION_ICON_SIZE,
  ROOM_ACTION_STROKE,
  ROOM_ACTION_SVG,
} from "@/components/rooms/room-action-styles";
import { RoomStatusBadge } from "@/components/rooms/room-status-badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getUserPlan } from "@/lib/plans/queries";
import { requireHost } from "@/lib/rooms/authorization";
import { listAllowedEmailsForRoom } from "@/lib/rooms/email-allowlist";
import { getRoomById, listRoomMembers } from "@/lib/rooms/queries";
import { deriveRoomStatus } from "@/lib/rooms/schedule";

type EditRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({
  params,
}: EditRoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  const room = await getRoomById(roomId);
  return {
    title: room ? `Edit ${room.title}` : "Edit room",
  };
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const user = await requireUser();
  const { roomId } = await params;

  const room = await getRoomById(roomId);
  if (!room) {
    notFound();
  }

  try {
    await requireHost(roomId);
  } catch {
    redirect("/dashboard");
  }

  const [members, plan, allowedEmails] = await Promise.all([
    listRoomMembers(room.id),
    getUserPlan(user.id),
    listAllowedEmailsForRoom(room.id),
  ]);
  const planMaxParticipants = plan.maxConcurrentParticipants;
  const status = deriveRoomStatus(room);

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <BackLink href="/dashboard/rooms" label="Rooms" />
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.02em]">
              {room.title}
            </h1>
            <RoomStatusBadge status={status} />
          </div>
        </div>
        <Button
          variant="ghost"
          size={ROOM_ACTION_ICON_SIZE}
          asChild
          title="Open room"
          className={ROOM_ACTION_ICON_BTN}
        >
          <Link href={`/room/${room.id}`} aria-label="Open room">
            <Video
              className={ROOM_ACTION_SVG}
              strokeWidth={ROOM_ACTION_STROKE}
            />
          </Link>
        </Button>
      </header>

      <section className="max-w-lg">
        <EditRoomForm
          roomId={room.id}
          title={room.title}
          maxParticipants={room.maxParticipants}
          startTime={room.startTime}
          endTime={room.endTime}
          scheduleEditable={status === "scheduled"}
          planMaxParticipants={planMaxParticipants}
          visibility={room.visibility}
          allowedEmails={allowedEmails}
        />
      </section>

      <section className="max-w-lg border-t border-border/70 pt-6">
        {members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="People who join with an account show up here."
          />
        ) : (
          <MemberRoleManager
            roomId={room.id}
            hostUserId={room.hostUserId}
            members={members}
          />
        )}
      </section>

      <section className="max-w-lg border-t border-border/70 pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Delete this room</p>
          <DeleteRoomButton
            roomId={room.id}
            roomTitle={room.title}
            size="icon"
          />
        </div>
      </section>
    </div>
  );
}
