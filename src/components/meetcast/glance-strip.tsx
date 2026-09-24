import Link from "next/link";

import { cn } from "@/lib/utils";

type GlanceStripProps = {
  seatsUsed: number;
  seatsLimit: number;
  roomCount: number;
  planName: string;
  className?: string;
};

function SeatDonut({ used, limit }: { used: number; limit: number }) {
  const max = Math.max(limit, 1);
  const pct = Math.min(1, used / max);
  const size = 52;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div
      className="relative shrink-0"
      role="meter"
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-label="Seat load"
    >
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="text-brand transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[0.7rem] font-semibold tabular-nums">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

export function GlanceStrip({
  seatsUsed,
  seatsLimit,
  roomCount,
  planName,
  className,
}: GlanceStripProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      <div className="col-span-2 flex items-center gap-3 rounded-lg border border-border/80 bg-surface-elevated px-3.5 py-3 sm:col-span-1">
        <SeatDonut used={seatsUsed} limit={seatsLimit} />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Seats</p>
          <p className="truncate text-xl font-semibold tracking-tight tabular-nums">
            {seatsUsed}/{seatsLimit}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-surface-elevated px-3.5 py-3">
        <p className="text-xs text-muted-foreground">Rooms</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
          {roomCount}
        </p>
      </div>

      <Link
        href="/plans"
        className="rounded-lg border border-border/80 bg-surface-elevated px-3.5 py-3 transition-colors hover:border-brand/35 hover:bg-brand-soft/40"
      >
        <p className="text-xs text-muted-foreground">Plan</p>
        <p className="mt-0.5 truncate text-xl font-semibold tracking-tight">
          {planName}
        </p>
      </Link>
    </div>
  );
}
