import { SITE_SOCIAL } from "@/lib/site/links";

/** `owner/repo` parsed from the public GitHub project URL. */
export const GITHUB_REPO_SLUG = "MiladJoodi/MeetCast" as const;

export function githubRepoUrl(): string {
  return SITE_SOCIAL.github.href;
}

export function formatStarCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
  return String(count);
}
