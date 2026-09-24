"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, MenuIcon, XIcon } from "lucide-react";

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
              "rounded-md px-2.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
    <div className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:gap-10">
      <aside className="hidden w-48 shrink-0 lg:block">
        <div className="sticky top-16 space-y-4">
          <p className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Docs
          </p>
          <NavList pathname={pathname} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm font-medium text-muted-foreground">Docs</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
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
            className="mb-6 rounded-lg border border-border p-2 lg:hidden"
          >
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        ) : null}

        <article className="docs-prose min-w-0">{children}</article>

        <nav
          className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between"
          aria-label="Docs pagination"
        >
          {prev ? (
            <Link
              href={prev.href}
              className="group flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-foreground/25 hover:bg-muted/40"
            >
              <ChevronLeft
                className="size-4 text-muted-foreground group-hover:text-foreground"
                aria-hidden
              />
              <span>
                <span className="block text-[0.6875rem] text-muted-foreground">
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
              className="group flex items-center justify-end gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-foreground/25 hover:bg-muted/40 sm:ml-auto"
            >
              <span className="text-right">
                <span className="block text-[0.6875rem] text-muted-foreground">
                  Next
                </span>
                <span className="font-medium">{next.label}</span>
              </span>
              <ChevronRight
                className="size-4 text-muted-foreground group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
