import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("mc-rail space-y-3 py-8", className)}>
      <p className="text-base font-semibold tracking-[-0.02em]">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="w-full pt-1 sm:w-auto">{action}</div> : null}
    </div>
  );
}
