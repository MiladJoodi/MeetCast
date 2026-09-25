import Link from "next/link";

import { cn } from "@/lib/utils";

const TOUR = [
  { href: "/docs", label: "Docs" },
  { href: "/plans", label: "Plans" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

type MarketingTourNavProps = {
  current: (typeof TOUR)[number]["href"];
  className?: string;
};

/** Browse strip for guests who never open an account. */
export function MarketingTourNav({ current, className }: MarketingTourNavProps) {
  return (
    <nav
      aria-label="Explore MeetCast"
      className={cn(
        "mc-mkt-in-4 mt-14 border-t border-white/10 pt-8",
        className,
      )}
    >
      <p className="mb-3 text-[0.6875rem] font-medium tracking-[0.14em] text-white/40 uppercase">
        Keep exploring
      </p>
      <ul className="flex flex-wrap gap-2">
        {TOUR.map((item, index) => {
          const active =
            item.href === "/docs"
              ? current === "/docs" || current.startsWith("/docs/")
              : item.href === current;
          return (
            <li
              key={item.href}
              className="mc-mkt-chip"
              style={{ animationDelay: `${0.45 + index * 0.05}s` }}
            >
              <Link
                href={item.href}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3.5 text-sm transition-[border-color,background-color,color,transform] duration-200",
                  active
                    ? "border-white/25 bg-white/10 font-medium text-white"
                    : "border-white/10 text-white/60 hover:border-white/20 hover:bg-white/5 hover:text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
