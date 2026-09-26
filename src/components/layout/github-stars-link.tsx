"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { formatStarCount, githubRepoUrl } from "@/lib/site/github-shared";
import { cn } from "@/lib/utils";

type GitHubStarsLinkProps = {
  tone?: "dark" | "light";
  className?: string;
  /** Compact icon+count for tight header slots */
  compact?: boolean;
};

/**
 * Renders immediately; star count loads after paint so GitHub never blocks LCP.
 */
export function GitHubStarsLink({
  tone = "dark",
  className,
  compact = false,
}: GitHubStarsLinkProps) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 2500);

    fetch("/api/github-stars", { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { stars?: unknown } | null) => {
        if (cancelled) return;
        if (typeof data?.stars === "number") setStars(data.stars);
      })
      .catch(() => {
        /* badge stays without a count */
      })
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, []);

  const countLabel = stars === null ? "—" : formatStarCount(stars);
  const label =
    stars === null
      ? "Star MeetCast on GitHub"
      : `Star MeetCast on GitHub (${stars} stars)`;

  return (
    <a
      href={githubRepoUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[0.75rem] font-medium tabular-nums transition-colors",
        tone === "dark"
          ? "border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10 hover:text-white"
          : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
        compact && "px-2",
        className,
      )}
    >
      <GitHubIcon className="size-3.5 shrink-0" />
      {/* Keep descriptive link text in the DOM (Lighthouse SEO). */}
      <span className={cn(!compact && "hidden sm:inline")}>Star MeetCast</span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          tone === "dark" ? "text-white/90" : "text-foreground",
        )}
      >
        <Star
          className={cn(
            "size-3 fill-current",
            tone === "dark" ? "text-amber-300/90" : "text-amber-500",
          )}
          aria-hidden
        />
        {countLabel}
      </span>
    </a>
  );
}
