"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isDarkMarketingPath } from "@/lib/layout/marketing-paths";

function isAppRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin")
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  // Dark marketing / auth / invite — no light footer.
  if (isAppRoute(pathname) || isDarkMarketingPath(pathname)) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[-0.02em]">MeetCast</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Rooms with a start time, an invite, and a clear end.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Product
            </p>
            <nav className="flex flex-col gap-1.5 text-sm" aria-label="Product">
              <Link
                href="/plans"
                className="text-muted-foreground hover:text-foreground"
              >
                Plans
              </Link>
            </nav>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Account
            </p>
            <nav className="flex flex-col gap-1.5 text-sm" aria-label="Account">
              {pathname !== "/login" ? (
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
              ) : null}
              {pathname !== "/register" ? (
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Create account
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Legal
            </p>
            <nav className="flex flex-col gap-1.5 text-sm" aria-label="Legal">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">© 2026 MeetCast</p>
      </div>
    </footer>
  );
}
