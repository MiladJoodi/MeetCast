import { GITHUB_REPO_SLUG } from "@/lib/site/github-shared";

export {
  GITHUB_REPO_SLUG,
  formatStarCount,
  githubRepoUrl,
} from "@/lib/site/github-shared";

/** Never let GitHub hang longer than this. */
const GITHUB_FETCH_TIMEOUT_MS = 2000;

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
        signal: AbortSignal.timeout(GITHUB_FETCH_TIMEOUT_MS),
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
