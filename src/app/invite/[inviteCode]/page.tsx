import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RoomStatusBadge } from "@/components/rooms/room-status-badge";
import { GuestJoinForm } from "@/components/rooms/guest-join-form";
import { MemberJoinButton } from "@/components/rooms/member-join-button";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { isEmailAllowedForRoom } from "@/lib/rooms/email-allowlist";
import { getMembership, getRoomByInviteCode } from "@/lib/rooms/queries";
import {
  deriveRoomStatus,
  formatRoomInstant,
} from "@/lib/rooms/schedule";
import { cn } from "@/lib/utils";

type InvitePageProps = {
  params: Promise<{ inviteCode: string }>;
};

export async function generateMetadata({
  params,
}: InvitePageProps): Promise<Metadata> {
  const { inviteCode } = await params;
  const room = await getRoomByInviteCode(inviteCode);
  return {
    title: room ? `Join ${room.title}` : "Invite",
  };
}

function InviteShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="mc-invite-page relative isolate flex flex-1 flex-col overflow-hidden text-[var(--room-fg)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mc-stage-aura mc-stage-aura-1" />
        <div className="mc-stage-aura mc-stage-aura-2" />
        <div className="mc-stage-grid opacity-[0.08]" />
      </div>
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 pb-10 pt-16 sm:px-6",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function InviteCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full space-y-6 rounded-2xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] p-6 shadow-[0_28px_70px_-28px_oklch(0_0_0/0.55)] sm:p-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

function InviteHeader({
  title,
  status,
  maxParticipants,
  endTime,
  privateMeeting,
}: {
  title: string;
  status: ReturnType<typeof deriveRoomStatus>;
  maxParticipants: number;
  endTime: Date;
  privateMeeting?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white/50">
        {privateMeeting ? "Private meeting" : "You're invited"}
      </p>
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-balance text-white">
        {title}
      </h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <RoomStatusBadge status={status} />
        <span className="text-xs text-white/45">
          Up to {maxParticipants} · ends {formatRoomInstant(endTime)}
        </span>
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteCode } = await params;
  const room = await getRoomByInviteCode(inviteCode);
  if (!room) notFound();

  const status = deriveRoomStatus(room);
  const isPrivate = room.visibility === "private";

  if (status === "ended") {
    return (
      <InviteShell>
        <InviteCard>
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/50">Invite</p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">
              This meeting has ended
            </h1>
            <RoomStatusBadge status={status} className="bg-white/10 text-white/65" />
            <p className="text-sm leading-relaxed text-white/55">
              Closed at {formatRoomInstant(room.endTime)}. This link no longer
              accepts participants.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/">Back to MeetCast</Link>
          </Button>
        </InviteCard>
      </InviteShell>
    );
  }

  if (status === "scheduled") {
    return (
      <InviteShell>
        <InviteCard>
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/50">Invite</p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">
              {room.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <RoomStatusBadge status={status} />
              <span className="text-xs text-white/45">
                Opens {formatRoomInstant(room.startTime)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/55">
              This room isn&apos;t open yet. Return with this link when it goes
              live.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/">Back to MeetCast</Link>
          </Button>
        </InviteCard>
      </InviteShell>
    );
  }

  const user = await getCurrentUser();
  const membership = user ? await getMembership(room.id, user.id) : null;
  const isHost = Boolean(user && room.hostUserId === user.id);
  const alreadyMember = Boolean(membership) || isHost;

  const emailAllowed = user
    ? await isEmailAllowedForRoom({
        roomId: room.id,
        hostUserId: room.hostUserId,
        visibility: room.visibility,
        actorUserId: user.id,
        email: user.email,
      })
    : false;

  const loginHref = `/login?next=${encodeURIComponent(`/invite/${inviteCode}`)}`;

  return (
    <InviteShell>
      <InviteCard>
        <InviteHeader
          title={room.title}
          status={status}
          maxParticipants={room.maxParticipants}
          endTime={room.endTime}
          privateMeeting={isPrivate}
        />

        <div className="space-y-4 border-t border-white/10 pt-5">
          {isPrivate ? (
            !user ? (
              <>
                <p className="text-sm leading-relaxed text-white/55">
                  Private meeting. Sign in with an invited account to continue.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full border-transparent bg-white text-[oklch(0.2_0.03_160)] hover:bg-white/90"
                    asChild
                  >
                    <Link href={loginHref}>Sign in</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link
                      href={`/register?next=${encodeURIComponent(`/invite/${inviteCode}`)}`}
                    >
                      Create account
                    </Link>
                  </Button>
                </div>
              </>
            ) : emailAllowed ? (
              alreadyMember ? (
                <>
                  <p className="text-sm text-white/55">
                    Your account is invited. You already have access.
                  </p>
                  <Button
                    className="w-full border-transparent bg-white text-[oklch(0.2_0.03_160)] hover:bg-white/90"
                    asChild
                  >
                    <Link href={`/room/${room.id}`}>Enter meeting</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/55">
                    Your account is invited
                    {user.email ? (
                      <>
                        {" "}
                        (<span className="text-white/45">({user.email})</span>
                      </>
                    ) : null}
                    .
                  </p>
                  <MemberJoinButton inviteCode={room.inviteCode} tone="room" />
                </>
              )
            ) : (
              <>
                <p className="text-sm leading-relaxed text-white/55">
                  You don&apos;t have access to this meeting. This is a private
                  meeting and your account isn&apos;t on the guest list.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/">Back to MeetCast</Link>
                </Button>
              </>
            )
          ) : alreadyMember ? (
            <>
              <p className="text-sm text-white/55">You already have access.</p>
              <Button
                className="w-full border-transparent bg-white text-[oklch(0.2_0.03_160)] hover:bg-white/90"
                asChild
              >
                <Link href={`/room/${room.id}`}>Enter meeting</Link>
              </Button>
            </>
          ) : user ? (
            <>
              <p className="text-sm text-white/55">
                Signed in as{" "}
                <span className="font-medium text-white">{user.name}</span>.
              </p>
              <MemberJoinButton inviteCode={room.inviteCode} tone="room" />
            </>
          ) : (
            <>
              <p className="text-sm text-white/55">
                <Link
                  href={loginHref}
                  className="font-medium text-white underline-offset-4 hover:underline"
                >
                  Log in
                </Link>{" "}
                or{" "}
                <Link
                  href={`/register?next=${encodeURIComponent(`/invite/${inviteCode}`)}`}
                  className="font-medium text-white underline-offset-4 hover:underline"
                >
                  create an account
                </Link>
                , or continue as a guest.
              </p>
              <GuestJoinForm inviteCode={room.inviteCode} tone="room" />
            </>
          )}
        </div>
      </InviteCard>
    </InviteShell>
  );
}
