/**
 * Absolute public origin for payment callbacks and redirects.
 * Prefer NEXT_PUBLIC_APP_URL; fall back is only for local development.
 */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }
  throw new Error("NEXT_PUBLIC_APP_URL is not set.");
}
