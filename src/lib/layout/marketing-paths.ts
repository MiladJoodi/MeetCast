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
    pathname === "/terms"
  );
}
