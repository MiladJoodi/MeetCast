/** Pure rate-limit helpers (no DB / headers) for unit tests and shared constants. */

export const RATE_LIMIT_WINDOWS = {
  loginIp: { limit: 20, windowMs: 15 * 60_000 },
  loginEmail: { limit: 10, windowMs: 15 * 60_000 },
  registerIp: { limit: 5, windowMs: 60 * 60_000 },
  guestJoinIp: { limit: 30, windowMs: 15 * 60_000 },
  livekitTokenIp: { limit: 120, windowMs: 60_000 },
  passwordChangeUser: { limit: 5, windowMs: 15 * 60_000 },
  accountDeleteUser: { limit: 5, windowMs: 15 * 60_000 },
  adminMutationUser: { limit: 60, windowMs: 60_000 },
  checkoutUser: { limit: 10, windowMs: 15 * 60_000 },
  forgotPasswordIp: { limit: 10, windowMs: 15 * 60_000 },
  forgotPasswordEmail: { limit: 5, windowMs: 15 * 60_000 },
} as const;

export function isRateLimitExceeded(used: number, limit: number): boolean {
  return used >= limit;
}
