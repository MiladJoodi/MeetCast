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
          ? "border-amber-400/35 bg-amber-400/10 text-white"
          : "border-white/12 bg-white/5 text-white",
        className,
      )}
    >
      {title ? (
        <p className="mb-1 text-xs font-semibold tracking-wide text-white/80 uppercase">
          {title}
        </p>
      ) : null}
      <div className="text-white/55 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-3 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_code]:text-white [&_p]:mt-2">
        {children}
      </div>
    </aside>
  );
}
