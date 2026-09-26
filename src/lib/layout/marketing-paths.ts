/** Public routes that use the dark room canvas (landing-style chrome). */
export function isDarkMarketingPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/invite/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email" ||
    pathname === "/contact" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/plans" ||
    pathname === "/docs" ||
    pathname.startsWith("/docs/")
  );
}

/**
 * Authenticated app chrome (AppShell). Public marketing routes are excluded —
 * including /plans and /docs, which use the shared dark site header.
 */
export function isAppChromePath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin")
  );
}

/** Live meeting UI owns its own chrome — hide the global site header/footer. */
export function isMeetingRoomPath(pathname: string): boolean {
  return pathname.startsWith("/room/");
}

/** Paths where the root SiteHeader must not render. */
export function hidesSiteHeader(
  pathname: string,
  signedIn: boolean,
): boolean {
  if (isMeetingRoomPath(pathname)) return true;
  return signedIn && isAppChromePath(pathname);
}
