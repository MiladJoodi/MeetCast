import { AppError } from "@/lib/errors";

/**
 * Require Origin (preferred) or Referer to match this request's host.
 * Defense-in-depth for cookie-authenticated JSON API POSTs.
 * Server Actions already get Next.js Origin vs Host checks.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host");

  if (!host) {
    throw new AppError("FORBIDDEN", "Invalid request origin.", 403);
  }

  const expectedHosts = new Set(
    host
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );

  const candidate = origin || referer;
  if (!candidate) {
    // Same-origin fetch from some browsers may omit Origin on same-site POST;
    // require at least one signal for JSON cookie APIs.
    throw new AppError("FORBIDDEN", "Invalid request origin.", 403);
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new AppError("FORBIDDEN", "Invalid request origin.", 403);
  }

  const requestHost = url.host.toLowerCase();
  if (!expectedHosts.has(requestHost)) {
    throw new AppError("FORBIDDEN", "Invalid request origin.", 403);
  }
}
