import { Star } from "lucide-react";

import { GitHubIcon } from "@/components/icons/github-icon";
import {
  formatStarCount,
  githubRepoUrl,
} from "@/lib/site/github";
import { cn } from "@/lib/utils";

type GitHubStarsLinkProps = {
  stars: number | null;
  tone?: "dark" | "light";
  className?: string;
  /** Compact icon+count for tight header slots */
  compact?: boolean;
};

export function GitHubStarsLink({
  stars,
  tone = "dark",
  className,
  compact = false,
}: GitHubStarsLinkProps) {
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
      {!compact ? <span className="hidden sm:inline">Star</span> : null}
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
        {stars === null ? "—" : formatStarCount(stars)}
      </span>
    </a>
  );
}
