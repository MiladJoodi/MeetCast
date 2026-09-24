export const SESSION_COOKIE_NAME = "meetcast_session";

/** Session lifetime in milliseconds (30 days). */
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 80;

/** Soft cap so multi-device sessions cannot grow unbounded. */
export const MAX_SESSIONS_PER_USER = 10;
