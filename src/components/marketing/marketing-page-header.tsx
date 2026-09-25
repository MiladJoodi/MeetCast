import { cn } from "@/lib/utils";

type MarketingPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
  /** Optional live pulse on the eyebrow — meeting/room metaphor */
  live?: boolean;
};

export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  className,
  live = true,
}: MarketingPageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      <p className="mc-mkt-in flex items-center gap-2 text-sm font-medium tracking-wide text-white/50">
        {live ? <span className="mc-mkt-live" aria-hidden /> : null}
        {eyebrow}
      </p>
      <div className="space-y-3">
        <h1 className="mc-mkt-in-2 text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.045em] text-white text-balance">
          {title}
        </h1>
        <span className="mc-mkt-rule block h-px w-16 bg-[color-mix(in_oklch,var(--live)_85%,white)]" />
        <p className="mc-mkt-in-3 max-w-xl text-[0.9375rem] leading-relaxed text-white/55">
          {description}
        </p>
      </div>
    </header>
  );
}
