import { cn } from "@/lib/utils";

type DocsCalloutProps = {
  title?: string;
  variant?: "note" | "warning";
  children: React.ReactNode;
  className?: string;
};

export function DocsCallout({
  title,
  variant = "note",
  children,
  className,
}: DocsCalloutProps) {
  return (
    <aside
      className={cn(
        "rounded-lg border px-4 py-3 text-sm leading-relaxed",
        variant === "warning"
          ? "border-amber-500/35 bg-amber-500/8 text-foreground"
          : "border-border bg-muted/35 text-foreground",
        className,
      )}
    >
      {title ? (
        <p className="mb-1 text-xs font-semibold tracking-wide uppercase">
          {title}
        </p>
      ) : null}
      <div className="text-muted-foreground [&_a]:underline [&_a]:underline-offset-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_code]:text-foreground">
        {children}
      </div>
    </aside>
  );
}
