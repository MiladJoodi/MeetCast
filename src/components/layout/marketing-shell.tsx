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
        "mc-invite-page relative isolate flex flex-1 flex-col text-[var(--room-fg)]",
        scrollable ? "overflow-x-hidden" : "overflow-hidden",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mc-stage-aura mc-stage-aura-1" />
        <div className="mc-stage-aura mc-stage-aura-2" />
        <div className="mc-stage-grid opacity-[0.08]" />
      </div>
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16 pt-20 sm:px-6",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
