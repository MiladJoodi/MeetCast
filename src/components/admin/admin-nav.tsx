"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/audit-logs", label: "Audit logs" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border/80"
      aria-label="Admin"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-brand font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
