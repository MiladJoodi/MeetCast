import { cn } from "@/lib/utils";

type MarketingShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Allow page scroll (docs / plans). Default invite pages lock overflow. */
  scrollable?: boolean;
};

/**
 * Dark room canvas for public marketing pages
 * — same atmosphere as the landing / auth screens.
 */
export function MarketingShell({
  children,
  className,
  scrollable = false,
}: MarketingShellProps) {
  return (
    <div
      className={cn(
        "mc-invite-page relative isolate flex w-full min-w-0 flex-col text-[var(--room-fg)]",
        // overflow-x-hidden forces overflow-y:auto → double scrollbar. Prefer clip.
        // scrollable pages size to content (body scrolls once); locked pages fill + clip.
        scrollable
          ? "overflow-x-clip"
          : "min-h-0 flex-1 overflow-hidden",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mc-stage-aura mc-stage-aura-1" />
        <div className="mc-stage-aura mc-stage-aura-2" />
        <div className="mc-stage-grid opacity-[0.08]" />
      </div>
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full min-w-0 max-w-2xl flex-col px-4 pb-16 pt-20 sm:px-6",
          !scrollable && "flex-1",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
