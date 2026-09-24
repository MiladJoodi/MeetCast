import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const isProd = process.env.NODE_ENV === "production";

function liveKitConnectSources(): string | null {
  const raw = process.env.LIVEKIT_URL?.trim();
  if (!raw) {
    return null;
  }
  try {
    const normalized = raw.replace(/^ws:/i, "http:").replace(/^wss:/i, "https:");
    const url = new URL(normalized);
    const host = url.host;
    if (!host) {
      return null;
    }
    return `https://${host} wss://${host}`;
  } catch {
    return null;
  }
}

/**
 * Baseline browser security headers.
 * CSP connect-src allows LiveKit/WebRTC signaling without blanket https:/wss: when LIVEKIT_URL is set.
 */
function securityHeaders(): { key: string; value: string }[] {
  const liveKit = liveKitConnectSources();
  const connectSrc = isDev
    ? "'self' https: http: wss: ws: blob:"
    : liveKit
      ? `'self' blob: ${liveKit}`
      : "'self' https: wss: blob:";

  const contentSecurityPolicy = [
    "default-src 'self'",
    // Next.js App Router may require inline/eval for hydration in some builds.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    `connect-src ${connectSrc}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  const headers: { key: string; value: string }[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(self), microphone=(self), display-capture=(self), geolocation=(), interest-cohort=()",
    },
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ];

  if (isProd) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
    ];
  },
};

export default nextConfig;
