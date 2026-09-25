import { SITE_SOCIAL } from "@/lib/site/links";

/** `owner/repo` parsed from the public GitHub project URL. */
export const GITHUB_REPO_SLUG = "MiladJoodi/MeetCast" as const;

export function githubRepoUrl(): string {
  return SITE_SOCIAL.github.href;
}

/**
 * Cached GitHub star count for the header badge.
 * Returns null when the API is unavailable (badge still links to the repo).
 */
export async function getGithubStarCount(): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_SLUG}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "MeetCast",
        },
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

export function formatStarCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
  return String(count);
}
