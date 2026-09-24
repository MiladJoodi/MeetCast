export const MAX_ROOM_PARTICIPANTS = 50;
export const MIN_ROOM_PARTICIPANTS = 2;
export const ROOM_TITLE_MAX_LENGTH = 60;
export const GUEST_NAME_MAX_LENGTH = 80;
/** Max emails on a room allowlist. */
export const MAX_ROOM_ALLOWED_EMAILS = 50;

/** Opaque invite codes are 24 bytes → ~32 chars base64url. */
export const INVITE_CODE_BYTES = 24;

export const GUEST_COOKIE_NAME = "meetcast_guest";
export const GUEST_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;
export const GUEST_SESSION_MAX_AGE_SECONDS = GUEST_SESSION_MAX_AGE_MS / 1000;

/** Minimum allowed meeting window (backend-enforced). */
export const MIN_ROOM_DURATION_MS = 5 * 60 * 1000;

/**
 * Default max meeting duration (technical ceiling).
 * Plan-based limits use getEffectiveMaxRoomDurationMs(plan).
 */
export const DEFAULT_MAX_ROOM_DURATION_MS = 4 * 60 * 60 * 1000;

/** End-of-meeting participant warnings (only these two). */
export const ROOM_END_WARNING_MS = [10 * 60 * 1000, 5 * 60 * 1000] as const;

/**
 * @deprecated Prefer getEffectiveMaxRoomDurationMs(plan) from @/lib/plans/limits.
 * Kept for UI forms that have not yet received a plan-specific max.
 */
export function getMaxRoomDurationMs(options?: {
  planId?: string | null;
  maxDurationMs?: number;
}): number {
  if (typeof options?.maxDurationMs === "number") {
    return Math.min(DEFAULT_MAX_ROOM_DURATION_MS, options.maxDurationMs);
  }
  void options?.planId;
  return DEFAULT_MAX_ROOM_DURATION_MS;
}
