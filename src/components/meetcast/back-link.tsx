import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type BackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

/** Shared back navigation for detail pages and return actions. */
export function BackLink({ href, label, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ChevronLeft className="size-4 shrink-0" aria-hidden strokeWidth={2} />
      {label}
    </Link>
  );
}
