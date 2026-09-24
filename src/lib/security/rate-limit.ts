import "server-only";

import { createHash } from "node:crypto";

import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { rateLimitEvents } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  isRateLimitExceeded,
  RATE_LIMIT_WINDOWS,
} from "@/lib/security/rate-limit-policy";

export { isRateLimitExceeded, RATE_LIMIT_WINDOWS } from "@/lib/security/rate-limit-policy";

const RETENTION_MS = 24 * 60 * 60_000;

const GENERIC_RATE_LIMIT_MESSAGE =
  "Too many attempts. Please try again later.";

export function hashRateLimitSubject(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function rateLimitBucketKey(action: string, subject: string): string {
  return `${action}:${hashRateLimitSubject(subject)}`;
}

/**
 * Client IP from trusted proxy headers.
 * Requires the reverse proxy to overwrite X-Forwarded-For / X-Real-IP.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

async function countEventsInWindow(
  bucketKey: string,
  windowMs: number,
): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  const [row] = await db
    .select({ value: count() })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.bucketKey, bucketKey),
        gt(rateLimitEvents.createdAt, since),
      ),
    );
  return Number(row?.value ?? 0);
}

async function pruneOldEvents(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_MS);
  try {
    await db
      .delete(rateLimitEvents)
      .where(lt(rateLimitEvents.createdAt, cutoff));
  } catch (error) {
    logger.warn("security.rate_limit_prune_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  }
}

export async function recordRateLimitEvent(bucketKey: string): Promise<void> {
  await db.insert(rateLimitEvents).values({ bucketKey });
  // Best-effort prune (~1% of writes) to avoid constant DELETE cost.
  if (Math.random() < 0.01) {
    void pruneOldEvents();
  }
}

/**
 * Throws RATE_LIMITED when the bucket is already at/over the limit.
 * Does not record an event — call recordRateLimitEvent after a failure
 * (e.g. bad login) or use assertAndRecordRateLimit for every attempt.
 */
export async function assertWithinRateLimit(input: {
  action: string;
  subject: string;
  limit: number;
  windowMs: number;
  message?: string;
}): Promise<void> {
  const bucketKey = rateLimitBucketKey(input.action, input.subject);
  const used = await countEventsInWindow(bucketKey, input.windowMs);
  if (isRateLimitExceeded(used, input.limit)) {
    logger.info("security.rate_limited", { action: input.action });
    throw new AppError(
      "RATE_LIMITED",
      input.message ?? GENERIC_RATE_LIMIT_MESSAGE,
      429,
    );
  }
}

/** Check then record (register, guest join, token, admin mutations). */
export async function assertAndRecordRateLimit(input: {
  action: string;
  subject: string;
  limit: number;
  windowMs: number;
  message?: string;
}): Promise<void> {
  const bucketKey = rateLimitBucketKey(input.action, input.subject);
  const used = await countEventsInWindow(bucketKey, input.windowMs);
  if (isRateLimitExceeded(used, input.limit)) {
    logger.info("security.rate_limited", { action: input.action });
    throw new AppError(
      "RATE_LIMITED",
      input.message ?? GENERIC_RATE_LIMIT_MESSAGE,
      429,
    );
  }
  await recordRateLimitEvent(bucketKey);
}

export async function assertLoginRateLimits(email: string): Promise<void> {
  const ip = await getClientIp();
  await assertWithinRateLimit({
    action: "login:ip",
    subject: ip,
    ...RATE_LIMIT_WINDOWS.loginIp,
    message: "Invalid email or password.",
  });
  await assertWithinRateLimit({
    action: "login:email",
    subject: email.toLowerCase(),
    ...RATE_LIMIT_WINDOWS.loginEmail,
    message: "Invalid email or password.",
  });
}

export async function recordLoginFailure(email: string): Promise<void> {
  const ip = await getClientIp();
  await recordRateLimitEvent(rateLimitBucketKey("login:ip", ip));
  await recordRateLimitEvent(
    rateLimitBucketKey("login:email", email.toLowerCase()),
  );
}

export async function assertRegisterRateLimit(): Promise<void> {
  const ip = await getClientIp();
  await assertAndRecordRateLimit({
    action: "register:ip",
    subject: ip,
    ...RATE_LIMIT_WINDOWS.registerIp,
  });
}

export async function assertGuestJoinRateLimit(): Promise<void> {
  const ip = await getClientIp();
  await assertAndRecordRateLimit({
    action: "guest_join:ip",
    subject: ip,
    ...RATE_LIMIT_WINDOWS.guestJoinIp,
  });
}

export async function assertLiveKitTokenRateLimit(): Promise<void> {
  const ip = await getClientIp();
  await assertAndRecordRateLimit({
    action: "livekit_token:ip",
    subject: ip,
    ...RATE_LIMIT_WINDOWS.livekitTokenIp,
  });
}

export async function assertPasswordChangeRateLimit(
  userId: string,
): Promise<void> {
  await assertAndRecordRateLimit({
    action: "password_change:user",
    subject: userId,
    ...RATE_LIMIT_WINDOWS.passwordChangeUser,
  });
}

export async function assertAccountDeleteRateLimit(
  userId: string,
): Promise<void> {
  await assertAndRecordRateLimit({
    action: "account_delete:user",
    subject: userId,
    ...RATE_LIMIT_WINDOWS.accountDeleteUser,
  });
}

export async function assertAdminMutationRateLimit(
  adminUserId: string,
): Promise<void> {
  await assertAndRecordRateLimit({
    action: "admin_mutation:user",
    subject: adminUserId,
    ...RATE_LIMIT_WINDOWS.adminMutationUser,
  });
}

export async function assertCheckoutRateLimit(userId: string): Promise<void> {
  await assertAndRecordRateLimit({
    action: "checkout:user",
    subject: userId,
    ...RATE_LIMIT_WINDOWS.checkoutUser,
    message: "Too many checkout attempts. Please try again later.",
  });
}

export async function assertForgotPasswordRateLimits(
  email: string,
): Promise<void> {
  const ip = await getClientIp();
  await assertAndRecordRateLimit({
    action: "forgot_password:ip",
    subject: ip,
    ...RATE_LIMIT_WINDOWS.forgotPasswordIp,
  });
  await assertAndRecordRateLimit({
    action: "forgot_password:email",
    subject: email.toLowerCase(),
    ...RATE_LIMIT_WINDOWS.forgotPasswordEmail,
  });
}
