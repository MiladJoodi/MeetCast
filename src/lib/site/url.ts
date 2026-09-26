/**
 * Public site origin for metadata, robots, and sitemap.
 * Safe for SEO routes — never throws (unlike getAppOrigin for payments).
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return process.env.NODE_ENV === "production"
    ? "https://webinari.ir"
    : "http://localhost:3000";
}
