import type { DerivedRoomStatus } from "@/lib/rooms/schedule";
import { cn } from "@/lib/utils";

const META: Record<
  DerivedRoomStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-warning/15 text-warning",
  },
  live: {
    label: "Live",
    className: "bg-live/15 text-live",
  },
  ended: {
    label: "Ended",
    className: "bg-muted text-muted-foreground",
  },
};

type RoomStatusBadgeProps = {
  status: DerivedRoomStatus;
  className?: string;
};

export function RoomStatusBadge({ status, className }: RoomStatusBadgeProps) {
  const meta = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {status === "live" ? (
        <span className="relative flex size-1.5 shrink-0" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-60" />
          <span className="relative size-1.5 rounded-full bg-live" />
        </span>
      ) : null}
      {meta.label}
    </span>
  );
}
