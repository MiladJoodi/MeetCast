import { cn } from "@/lib/utils";

type PageHeaderProps = {
  kicker?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="mc-rail min-w-0 space-y-2">
        {kicker ? <div className="mc-kicker">{kicker}</div> : null}
        <h1 className="mc-title text-balance">{title}</h1>
        {description ? (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-0.5">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
