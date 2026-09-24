/**
 * Documented environment variables for MeetCast.
 * Values are read only on the server (except NEXT_PUBLIC_APP_URL).
 * Secrets must never be imported into client components or NEXT_PUBLIC_* names.
 */
export const envKeys = [
  "DATABASE_URL",
  "LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "ADMIN_EMAILS",
  "ZARINPAL_MERCHANT_ID",
  "ZARINPAL_SANDBOX",
  "PAYMENT_PROVIDER",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const;

export type EnvKey = (typeof envKeys)[number];

export function getOptionalEnv(key: EnvKey): string | undefined {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value.trim();
}

export function getRequiredEnv(key: EnvKey): string {
  const value = getOptionalEnv(key);
  if (!value) {
    throw new Error(`${key} is not set.`);
  }
  return value;
}

const WEAK_LIVEKIT_SECRETS = new Set(["secret", "changeme", "password", "dev"]);

/** True when serving production traffic (not during `next build`). */
export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

/**
 * Production auth/database secret checks (session/guest signing).
 * Does not require LiveKit — safe for pages that only need auth.
 */
export function assertProductionAuthSecrets(): void {
  if (!isProductionRuntime()) {
    return;
  }

  const authSecret = getRequiredEnv("AUTH_SECRET");
  if (authSecret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be at least 32 characters in production.",
    );
  }

  getRequiredEnv("DATABASE_URL");
}

/**
 * Full production credential checks including LiveKit WSS requirements.
 * Call from LiveKit server config paths.
 */
export function assertProductionEnv(): void {
  assertProductionAuthSecrets();

  if (!isProductionRuntime()) {
    return;
  }

  const livekitUrl = getRequiredEnv("LIVEKIT_URL");
  if (!/^wss:\/\//i.test(livekitUrl) && !/^https:\/\//i.test(livekitUrl)) {
    throw new Error(
      "LIVEKIT_URL must use wss:// (or https://) in production.",
    );
  }

  getRequiredEnv("LIVEKIT_API_KEY");
  const livekitSecret = getRequiredEnv("LIVEKIT_API_SECRET");
  if (WEAK_LIVEKIT_SECRETS.has(livekitSecret.toLowerCase())) {
    throw new Error(
      "LIVEKIT_API_SECRET must not use a development default in production.",
    );
  }
}
