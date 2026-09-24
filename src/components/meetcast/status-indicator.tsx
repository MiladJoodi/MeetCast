import { cn } from "@/lib/utils";

export type SignalTone =
  | "neutral"
  | "live"
  | "scheduled"
  | "ended"
  | "success"
  | "warning"
  | "danger"
  | "host"
  | "moderator"
  | "guest"
  | "speaking";

const toneClass: Record<SignalTone, string> = {
  neutral: "text-muted-foreground before:bg-muted-foreground/50",
  live: "text-live before:bg-live",
  scheduled: "text-warning before:bg-warning",
  ended: "text-muted-foreground before:bg-muted-foreground/40",
  success: "text-success before:bg-success",
  warning: "text-warning before:bg-warning",
  danger: "text-danger before:bg-danger",
  host: "text-host before:bg-host",
  moderator: "text-moderator before:bg-moderator",
  guest: "text-guest before:bg-guest",
  speaking: "text-speaking before:bg-speaking",
};

type StatusSignalProps = {
  label: string;
  tone?: SignalTone;
  pulse?: boolean;
  className?: string;
};

/** Edge-marker status — not a pill badge. */
export function StatusSignal({
  label,
  tone = "neutral",
  pulse = false,
  className,
}: StatusSignalProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-normal before:block before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        toneClass[tone],
        pulse && "before:animate-pulse",
        className,
      )}
    >
      {label}
    </span>
  );
}
