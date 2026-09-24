/**
 * Validate same-origin relative redirect paths.
 * Rejects protocol-relative, absolute, and backslash-trick URLs.
 */
export function safeSameOriginPath(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return null;
  }
  if (trimmed.includes("\\")) {
    return null;
  }
  return trimmed;
}
