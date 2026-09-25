import { getCurrentUser } from "@/lib/auth/session";
import { getGithubStarCount } from "@/lib/site/github";

import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
  const [user, githubStars] = await Promise.all([
    getCurrentUser(),
    getGithubStarCount(),
  ]);
  return (
    <SiteHeaderClient
      user={user ? { role: user.role } : null}
      githubStars={githubStars}
    />
  );
}
