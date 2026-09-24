/**
 * Same-origin relative path only (open-redirect safe).
 * Returns null for empty, protocol-relative, or backslash paths.
 */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }
  return path;
}

export function withNextParam(href: string, nextPath: string | null | undefined) {
  if (!nextPath) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}next=${encodeURIComponent(nextPath)}`;
}
