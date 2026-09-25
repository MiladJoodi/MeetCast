"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { GitHubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import {
  isAppChromePath,
  isDarkMarketingPath,
} from "@/lib/layout/marketing-paths";
import { SITE_SOCIAL } from "@/lib/site/links";
import { cn } from "@/lib/utils";

type HeaderUser = { role: string } | null;

const publicLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/plans", label: "Plans" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteHeaderClient({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pathForOpen, setPathForOpen] = useState(pathname);

  if (pathname !== pathForOpen) {
    setPathForOpen(pathname);
    setOpen(false);
  }

  // App shell owns chrome on authenticated app routes.
  if (user && isAppChromePath(pathname)) {
    return null;
  }

  const onDarkMarketing = isDarkMarketingPath(pathname);

  const onLogin = pathname === "/login";
  const onRegister = pathname === "/register";
  const showLoginCta = !onLogin;
  const showRegisterCta = !onRegister;

  const linkQuiet = onDarkMarketing
    ? "text-[0.8125rem] text-white/70 transition-colors hover:text-white"
    : "text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground";

  const linkStrong = onDarkMarketing
    ? "text-[0.8125rem] font-semibold text-white transition-colors hover:text-white/85"
    : undefined;

  return (
    <header
      className={cn(
        "z-50",
        onDarkMarketing
          ? "pointer-events-none fixed inset-x-0 top-0 border-0 text-white"
          : "sticky top-0 border-b border-border bg-background text-foreground",
        onDarkMarketing &&
          (open ? "bg-black/95 backdrop-blur-md" : "bg-transparent"),
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex h-12 items-center justify-between gap-4",
          onDarkMarketing
            ? "mx-auto w-full max-w-6xl px-4 sm:px-6"
            : "mc-shell",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 md:gap-7">
          {!user ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "md:hidden",
                onDarkMarketing &&
                  "text-white hover:bg-white/10 hover:text-white",
              )}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <XIcon /> : <MenuIcon />}
            </Button>
          ) : null}

          <Link
            href="/"
            className={cn(
              "text-[0.9375rem] font-semibold tracking-[-0.03em]",
              onDarkMarketing && "text-white",
            )}
          >
            MeetCast
          </Link>

          <nav
            className="hidden items-center gap-5 md:flex"
            aria-label="Main"
          >
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkQuiet}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href={SITE_SOCIAL.github.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md transition-colors",
              onDarkMarketing
                ? "text-white/70 hover:bg-white/10 hover:text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="MeetCast on GitHub"
          >
            <GitHubIcon className="size-4.5" />
          </a>
          {user ? (
            <>
              {onDarkMarketing ? (
                <>
                  <Link href="/docs" className={cn(linkQuiet, "sm:hidden")}>
                    Docs
                  </Link>
                  <Link
                    href="/dashboard"
                    className={cn(linkStrong, "hidden sm:inline")}
                  >
                    Open desk
                  </Link>
                  <Link
                    href="/dashboard"
                    className={cn(linkStrong, "sm:hidden")}
                  >
                    Desk
                  </Link>
                  <LogoutButton
                    size="sm"
                    className="h-auto border-0 bg-transparent p-0 text-[0.8125rem] font-normal text-white/70 shadow-none hover:bg-transparent hover:text-white"
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/docs"
                    className="text-[0.8125rem] text-muted-foreground hover:text-foreground sm:hidden"
                  >
                    Docs
                  </Link>
                  <Button size="sm" className="hidden sm:inline-flex" asChild>
                    <Link href="/dashboard">Open desk</Link>
                  </Button>
                  <Button size="sm" className="sm:hidden" asChild>
                    <Link href="/dashboard">Desk</Link>
                  </Button>
                  <LogoutButton size="sm" />
                </>
              )}
            </>
          ) : onDarkMarketing ? (
            <div className="hidden items-center gap-4 sm:flex">
              {showLoginCta ? (
                <Link href="/login" className={linkQuiet}>
                  Log in
                </Link>
              ) : null}
              {showRegisterCta ? (
                <Link href="/register" className={linkStrong}>
                  Start
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              {showLoginCta ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              ) : null}
              {showRegisterCta ? (
                <Button size="sm" asChild>
                  <Link href="/register">Start</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {!user ? (
        <div
          id="mobile-nav"
          className={cn(
            "pointer-events-auto grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out md:hidden",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            open &&
              (onDarkMarketing
                ? "border-b border-white/15 bg-black"
                : "border-b border-border bg-background shadow-sm"),
          )}
        >
          <div className="min-h-0 overflow-hidden bg-inherit">
            <nav
              className={cn(
                "flex flex-col gap-0.5 py-3",
                onDarkMarketing
                  ? "mx-auto w-full max-w-6xl bg-black px-4 sm:px-6"
                  : "mc-shell",
              )}
              aria-label="Mobile"
            >
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "py-2 text-sm",
                    onDarkMarketing ? "text-white/85" : undefined,
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={SITE_SOCIAL.github.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 py-2 text-sm",
                  onDarkMarketing ? "text-white/85" : undefined,
                )}
                onClick={() => setOpen(false)}
              >
                <GitHubIcon className="size-4" />
                GitHub
              </a>
              <div
                className={cn(
                  "mt-2 flex flex-col gap-1 pt-3",
                  onDarkMarketing
                    ? "border-t border-white/10"
                    : "border-t border-border",
                )}
              >
                {onDarkMarketing ? (
                  <>
                    {showLoginCta ? (
                      <Link
                        href="/login"
                        className="py-2 text-sm text-white/80"
                        onClick={() => setOpen(false)}
                      >
                        Log in
                      </Link>
                    ) : null}
                    {showRegisterCta ? (
                      <Link
                        href="/register"
                        className="py-2 text-sm font-semibold text-white"
                        onClick={() => setOpen(false)}
                      >
                        Start
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <>
                    {showLoginCta ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href="/login" onClick={() => setOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                    ) : null}
                    {showRegisterCta ? (
                      <Button size="sm" className="w-full" asChild>
                        <Link href="/register" onClick={() => setOpen(false)}>
                          Start
                        </Link>
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
