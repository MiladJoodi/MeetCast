"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  LayoutGrid,
  Layers,
  MenuIcon,
  Receipt,
  Settings,
  Shield,
  XIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppSidebarUser = {
  name: string;
  role: string;
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/dashboard/rooms", label: "Rooms", icon: CalendarDays },
  { href: "/plans", label: "Plans", icon: Layers },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/settings", label: "Account", icon: Settings },
  { href: "/docs", label: "Docs", icon: BookOpen },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/dashboard/rooms") {
    return (
      pathname === "/dashboard/rooms" ||
      pathname.startsWith("/dashboard/rooms/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  isAdmin,
  onNavigate,
}: {
  pathname: string;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="App">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(
          pathname,
          item.href,
          "exact" in item ? item.exact : false,
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      {isAdmin ? (
        <Link
          href="/admin"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
            pathname.startsWith("/admin")
              ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
              : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          )}
        >
          <Shield className="size-4 shrink-0 opacity-90" aria-hidden />
          Admin
        </Link>
      ) : null}
    </nav>
  );
}

function SidebarChrome({
  user,
  pathname,
  onNavigate,
  className,
}: {
  user: AppSidebarUser;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="shrink-0 px-4 pt-6 pb-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="group inline-flex items-center gap-2"
        >
          <span
            className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-[0.7rem] font-bold text-sidebar-primary-foreground"
            aria-hidden
          >
            M
          </span>
          <span className="text-[1.05rem] font-semibold tracking-[-0.03em] text-sidebar-foreground">
            MeetCast
          </span>
        </Link>
        <p className="mt-2 text-[0.75rem] text-muted-foreground">
          Meeting desk
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        <NavLinks
          pathname={pathname}
          isAdmin={user.role === "admin"}
          onNavigate={onNavigate}
        />
      </div>

      <div className="shrink-0 space-y-2.5 border-t border-sidebar-border px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {firstName}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">Signed in</p>
          </div>
          <ThemeToggle />
        </div>
        <LogoutButton
          showIcon
          size="default"
          className="w-full justify-start gap-2"
        />
      </div>
    </div>
  );
}

export function AppSidebar({ user }: { user: AppSidebarUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* Mobile top bar — hamburger on the left (LTR) */}
      <div className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center gap-2 border-b border-border bg-background px-2 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-expanded={open}
          aria-controls="app-sidebar-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <XIcon /> : <MenuIcon />}
        </Button>
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight"
        >
          MeetCast
        </Link>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-[13.5rem] shrink-0 lg:flex">
        <SidebarChrome
          user={user}
          pathname={pathname}
          className="w-full border-r border-sidebar-border lg:rounded-l-2xl"
        />
      </aside>

      {/* Mobile drawer — kept mounted for enter/exit motion; slides from left */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-foreground/40 transition-opacity duration-300 ease-out",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-label="Close menu"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        />
        <aside
          id="app-sidebar-drawer"
          className={cn(
            "absolute inset-y-0 left-0 flex h-dvh w-[min(17rem,88vw)] flex-col shadow-[0_0_40px_-12px_oklch(0_0_0/0.35)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarChrome
            user={user}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            className="h-full min-h-0 w-full"
          />
        </aside>
      </div>
    </>
  );
}
