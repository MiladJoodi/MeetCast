import { cn } from "@/lib/utils";

type MarketingShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Dark room canvas for public marketing pages (contact, privacy, terms)
 * — same atmosphere as the landing / auth screens.
 */
export function MarketingShell({ children, className }: MarketingShellProps) {
  return (
    <div className="mc-invite-page relative isolate flex flex-1 flex-col overflow-hidden text-[var(--room-fg)]">
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
