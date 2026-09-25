import { cn } from "@/lib/utils";

type MarketingPanelProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger index for entrance delay */
  index?: number;
};

export function MarketingPanel({
  children,
  className,
  index = 0,
}: MarketingPanelProps) {
  return (
    <div
      className={cn(
        "mc-mkt-panel rounded-2xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] p-5 sm:p-6",
        className,
      )}
      style={{ animationDelay: `${0.28 + index * 0.08}s` }}
    >
      {children}
    </div>
  );
}
