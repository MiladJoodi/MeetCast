import type { Metadata } from "next";

import { GlanceStrip } from "@/components/meetcast/glance-strip";
import { RecentEndedRooms } from "@/components/rooms/recent-ended-rooms";
import { RoomRowActions } from "@/components/rooms/room-row-actions";
import { requireUser } from "@/lib/auth/session";
import { getAccountConcurrentUsage } from "@/lib/plans/usage";
import {
  countHostedRooms,
  listOpenHostedRooms,
  listRecentEndedHostedRooms,
} from "@/lib/rooms/queries";
import {
  deriveRoomStatus,
  formatRoomInstant,
  type DerivedRoomStatus,
} from "@/lib/rooms/schedule";

export const metadata: Metadata = {
  title: "Dashboard",
};

type RoomRow = {
  id: string;
  title: string;
  inviteCode: string;
  startTime: Date;
  endTime: Date;
  status: DerivedRoomStatus;
};

function toRow(room: {
  id: string;
  title: string;
  inviteCode: string;
  startTime: Date;
  endTime: Date;
}): RoomRow {
  return {
    id: room.id,
    title: room.title,
    inviteCode: room.inviteCode,
    startTime: room.startTime,
    endTime: room.endTime,
    status: deriveRoomStatus(room),
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [totalRooms, openRooms, endedRooms, usage] = await Promise.all([
    countHostedRooms(user.id),
    listOpenHostedRooms(user.id),
    listRecentEndedHostedRooms(user.id, 5),
    getAccountConcurrentUsage(user.id),
  ]);

  const open = openRooms.map(toRow);
  const live = open.filter((r) => r.status === "live");
  const upcoming = open.filter((r) => r.status === "scheduled");
  const ended = endedRooms.map(toRow);

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <div className="mc-enter flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
          Hi, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-[0.95rem]">
          {live.length > 0
            ? live.length === 1
              ? "A room is live — jump in when you’re ready."
              : `${live.length} rooms are live — jump in when you’re ready.`
            : upcoming.length > 0
              ? "Here’s what’s next on your desk."
              : "Your desk is clear for now."}
        </p>
      </header>

      <GlanceStrip
        seatsUsed={usage.used}
        seatsLimit={usage.limit}
        roomCount={totalRooms}
        planName={usage.plan.name}
      />

      <section aria-labelledby="focus-heading" className="space-y-3">
        <h2
          id="focus-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Now
        </h2>
        {live.length > 0 ? (
          <ul className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
            {live.map((room) => (
              <li
                key={room.id}
                className="flex items-center gap-3 border-b border-border/70 px-3.5 py-3 last:border-b-0 sm:px-4"
              >
                <span className="mc-live-dot shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.95rem] font-semibold tracking-tight">
                    {room.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    until{" "}
                    <span className="tabular-nums">
                      {new Intl.DateTimeFormat(undefined, {
                        timeStyle: "short",
                      }).format(room.endTime)}
                    </span>
                  </p>
                </div>
                <RoomRowActions
                  roomId={room.id}
                  roomTitle={room.title}
                  inviteCode={room.inviteCode}
                  status="live"
                />
              </li>
            ))}
          </ul>
        ) : upcoming[0] ? (
          <ul className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
            <li className="flex items-center gap-3 px-3.5 py-3 sm:px-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.95rem] font-semibold tracking-tight">
                  {upcoming[0].title}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {formatRoomInstant(upcoming[0].startTime)}
                </p>
              </div>
              <RoomRowActions
                roomId={upcoming[0].id}
                roomTitle={upcoming[0].title}
                inviteCode={upcoming[0].inviteCode}
                status="scheduled"
              />
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No live or upcoming room right now.
          </p>
        )}
      </section>

      <section aria-labelledby="upcoming-heading" className="space-y-3">
        <h2
          id="upcoming-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Coming up
        </h2>
        {upcoming.length === 0 || (live.length === 0 && upcoming.length <= 1) ? (
          <p className="text-sm text-muted-foreground">
            {upcoming.length === 0
              ? "No upcoming meetings."
              : "No other meetings."}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
            {(live.length === 0 ? upcoming.slice(1) : upcoming).map((room) => (
              <li
                key={room.id}
                className="flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 hover:bg-muted/30"
              >
                <p className="min-w-0 flex-1 truncate text-[0.95rem] font-semibold">
                  {room.title}
                </p>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatRoomInstant(room.startTime)}
                </span>
                <RoomRowActions
                  roomId={room.id}
                  roomTitle={room.title}
                  inviteCode={room.inviteCode}
                  status="scheduled"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="space-y-3">
        <h2
          id="recent-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Recent
        </h2>
        <RecentEndedRooms
          rooms={ended.slice(0, 5).map((room) => ({
            id: room.id,
            title: room.title,
            status: room.status,
            startLabel: formatRoomInstant(room.startTime),
            endLabel: formatRoomInstant(room.endTime),
            inviteCode: room.inviteCode,
          }))}
        />
      </section>
    </div>
  );
}
