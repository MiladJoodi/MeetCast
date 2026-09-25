"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, MenuIcon, XIcon } from "lucide-react";

import { MarketingTourNav } from "@/components/marketing/marketing-tour-nav";
import { Button } from "@/components/ui/button";
import { DOCS_NAV, docsPrevNext } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Documentation">
      {DOCS_NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "mc-mkt-docs-link rounded-md py-1.5 pr-2.5 pl-3 text-sm",
              active
                ? "bg-white/10 font-medium text-white"
                : "text-white/55 hover:bg-white/5 hover:text-white/85",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { prev, next } = docsPrevNext(pathname);

  return (
    <div className="mc-invite-page relative isolate flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip text-[var(--room-fg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="mc-stage-aura mc-stage-aura-1" />
        <div className="mc-stage-aura mc-stage-aura-2" />
        <div className="mc-stage-grid opacity-[0.1]" />
        <div className="mc-mkt-scan" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 gap-8 px-4 pb-16 pt-20 sm:px-6 sm:pt-24 lg:gap-10">
        <aside className="mc-mkt-in hidden w-52 shrink-0 lg:block">
          <div className="sticky top-16 space-y-5">
            <div className="space-y-1 px-2.5">
              <p className="flex items-center gap-2 text-[0.6875rem] font-medium tracking-[0.14em] text-white/45 uppercase">
                <span className="mc-mkt-live" aria-hidden />
                Docs
              </p>
              <p className="text-xs leading-relaxed text-white/35">
                How the product actually works.
              </p>
            </div>
            <NavList pathname={pathname} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mc-mkt-in mb-6 flex items-center justify-between gap-3 lg:hidden">
            <p className="flex items-center gap-2 text-sm font-medium text-white/55">
              <span className="mc-mkt-live" aria-hidden />
              Docs
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              aria-expanded={open}
              aria-controls="docs-mobile-nav"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? (
                <XIcon className="size-4" aria-hidden />
              ) : (
                <MenuIcon className="size-4" aria-hidden />
              )}
              Menu
            </Button>
          </div>

          {open ? (
            <div
              id="docs-mobile-nav"
              className="mb-6 rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] p-2 lg:hidden"
            >
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          ) : null}

          <article className="docs-prose mc-mkt-in-2 min-w-0">{children}</article>

          <nav
            className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between"
            aria-label="Docs pagination"
          >
            {prev ? (
              <Link
                href={prev.href}
                className="group flex items-center gap-2 rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] px-3 py-2.5 text-sm text-white/80 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:text-white"
              >
                <ChevronLeft
                  className="size-4 text-white/45 group-hover:text-white"
                  aria-hidden
                />
                <span>
                  <span className="block text-[0.6875rem] text-white/45">
                    Previous
                  </span>
                  <span className="font-medium">{prev.label}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={next.href}
                className="group flex items-center justify-end gap-2 rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] px-3 py-2.5 text-sm text-white/80 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:text-white sm:ml-auto"
              >
                <span className="text-right">
                  <span className="block text-[0.6875rem] text-white/45">
                    Next
                  </span>
                  <span className="font-medium">{next.label}</span>
                </span>
                <ChevronRight
                  className="size-4 text-white/45 group-hover:text-white"
                  aria-hidden
                />
              </Link>
            ) : null}
          </nav>

          <MarketingTourNav current="/docs" />
        </div>
      </div>
    </div>
  );
}
