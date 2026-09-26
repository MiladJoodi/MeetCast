import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site/url";

/** Public marketing + docs URLs for crawlers (auth/app routes excluded). */
const PUBLIC_PATHS = [
  "/",
  "/plans",
  "/docs",
  "/docs/getting-started",
  "/docs/architecture",
  "/docs/authentication",
  "/docs/meetings",
  "/docs/realtime",
  "/docs/plans",
  "/docs/billing",
  "/docs/security",
  "/docs/deployment",
  "/docs/troubleshooting",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/register",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? origin : `${origin}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/docs") ? 0.7 : 0.8,
  }));
}
