import Link from "next/link";

import type { AdminOverviewStats } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

type AdminOverviewProps = {
  stats: AdminOverviewStats;
};

function StatCard({
  label,
  value,
  href,
  hint,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border border-border/80 bg-surface-elevated p-4 shadow-[0_1px_0_oklch(0.2_0.02_160/0.04)] transition-colors hover:border-brand/35 hover:bg-brand-soft/20",
        accent && "border-brand/30 bg-brand-soft/25",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {accent && value > 0 ? (
          <span className="mc-live-dot" aria-hidden />
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Link>
  );
}

function RoomStatusChart({
  live,
  scheduled,
  ended,
}: {
  live: number;
  scheduled: number;
  ended: number;
}) {
  const total = live + scheduled + ended;
  const slices = [
    { key: "live", label: "Live", value: live, className: "text-success" },
    {
      key: "scheduled",
      label: "Scheduled",
      value: scheduled,
      className: "text-warning",
    },
    { key: "ended", label: "Ended", value: ended, className: "text-muted-foreground" },
  ] as const;

  const size = 148;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto shrink-0 sm:mx-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted"
          />
          {total > 0
            ? slices.map((slice) => {
                const len = (slice.value / total) * c;
                const el = (
                  <circle
                    key={slice.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    strokeDasharray={`${len} ${c - len}`}
                    strokeDashoffset={-offset}
                    className={slice.className}
                  />
                );
                offset += len;
                return el;
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-semibold tabular-nums">{total}</p>
          <p className="text-xs text-muted-foreground">rooms</p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-3">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <li key={slice.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{slice.label}</span>
                <span className="font-medium tabular-nums">
                  {slice.value}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {pct}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    slice.key === "live" && "bg-success",
                    slice.key === "scheduled" && "bg-warning",
                    slice.key === "ended" && "bg-muted-foreground/40",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlanShareBars({
  rows,
  totalUsers,
}: {
  rows: AdminOverviewStats["usersByPlan"];
  totalUsers: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.users));

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No plans to show yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const width = Math.max(4, (row.users / max) * 100);
        const pct =
          totalUsers > 0 ? Math.round((row.users / totalUsers) * 100) : 0;
        return (
          <li key={row.planId} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{row.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.users} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminOverview({ stats }: AdminOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={stats.totalUsers}
          href="/admin/users"
          hint={`${stats.adminUsers} admin${stats.adminUsers === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Live"
          value={stats.liveRooms}
          href="/admin/rooms"
          hint="Open now"
          accent
        />
        <StatCard
          label="Rooms"
          value={stats.totalRooms}
          href="/admin/rooms"
          hint={`${stats.scheduledRooms} scheduled`}
        />
        <StatCard
          label="Plans"
          value={stats.activePlans}
          href="/admin/plans"
          hint="Active plans"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-border/80 bg-surface-elevated p-5 shadow-[0_1px_0_oklch(0.2_0.02_160/0.04)]">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Room status
            </h2>
            <Link
              href="/admin/rooms"
              className="text-xs text-brand hover:underline"
            >
              View rooms
            </Link>
          </div>
          <RoomStatusChart
            live={stats.liveRooms}
            scheduled={stats.scheduledRooms}
            ended={stats.endedRooms}
          />
        </section>

        <section className="rounded-xl border border-border/80 bg-surface-elevated p-5 shadow-[0_1px_0_oklch(0.2_0.02_160/0.04)]">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Users by plan
            </h2>
            <Link
              href="/admin/plans"
              className="text-xs text-brand hover:underline"
            >
              Manage plans
            </Link>
          </div>
          <PlanShareBars rows={stats.usersByPlan} totalUsers={stats.totalUsers} />
        </section>
      </div>
    </div>
  );
}
