import { getCurrentUser } from "@/lib/auth/session";

import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <SiteHeaderClient user={user ? { role: user.role } : null} />
  );
}
