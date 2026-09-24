/** Strip obviously sensitive keys before persisting metadata. */
export function sanitizeAuditMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!metadata) {
    return undefined;
  }

  const blocked =
    /(password|passwd|secret|token|hash|authorization|cookie|credential|api[_-]?key|api[_-]?secret)/i;
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.test(key)) {
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      cleaned[key] = sanitizeAuditMetadata(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
