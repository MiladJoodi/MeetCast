import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, asc, eq, lt, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { sessions, users, type PublicUser } from "@/db/schema";
import {
  MAX_SESSIONS_PER_USER,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { assertProductionAuthSecrets, getRequiredEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { canRevokeIndividualSession } from "@/lib/auth/session-policy";

export type UserSessionSummary = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function sessionCookieOptions(expiresAt: Date) {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

function ensureAuthSecret(): void {
  assertProductionAuthSecrets();
  getRequiredEnv("AUTH_SECRET");
}

export function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  planId: string;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planId: user.planId,
    createdAt: user.createdAt,
  };
}

async function pruneExpiredSessions(userId: string): Promise<void> {
  await db
    .delete(sessions)
    .where(
      and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())),
    );
}

async function enforceSessionCap(userId: string): Promise<void> {
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(asc(sessions.createdAt));

  if (rows.length <= MAX_SESSIONS_PER_USER) {
    return;
  }

  const overflow = rows.length - MAX_SESSIONS_PER_USER;
  const toDelete = rows.slice(0, overflow).map((row) => row.id);
  for (const id of toDelete) {
    await db.delete(sessions).where(eq(sessions.id, id));
  }
}

export async function createSession(userId: string): Promise<void> {
  ensureAuthSecret();

  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await pruneExpiredSessions(userId);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  await enforceSessionCap(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt));
}

export async function invalidateCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  cookieStore.delete({
    name: SESSION_COOKIE_NAME,
    path: "/",
  });
}

export async function listUserSessions(
  userId: string,
): Promise<UserSessionSummary[]> {
  await pruneExpiredSessions(userId);

  const rows = await db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(asc(sessions.createdAt));

  // Newest first for UI.
  return rows.reverse();
}

export async function revokeSessionForUser(input: {
  userId: string;
  sessionId: string;
  currentSessionId: string;
}): Promise<void> {
  if (
    !canRevokeIndividualSession({
      sessionId: input.sessionId,
      currentSessionId: input.currentSessionId,
    })
  ) {
    throw new AppError(
      "FORBIDDEN",
      "Use log out to end your current session.",
      403,
    );
  }

  const deleted = await db
    .delete(sessions)
    .where(
      and(eq(sessions.id, input.sessionId), eq(sessions.userId, input.userId)),
    )
    .returning({ id: sessions.id });

  if (deleted.length === 0) {
    throw new AppError("NOT_FOUND", "Session not found.", 404);
  }

  logger.info("auth.session_revoked", {
    userId: input.userId,
    sessionId: input.sessionId,
  });
}

export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string,
): Promise<number> {
  const deleted = await db
    .delete(sessions)
    .where(
      and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)),
    )
    .returning({ id: sessions.id });

  logger.info("auth.other_sessions_revoked", {
    userId,
    count: deleted.length,
  });

  return deleted.length;
}

/** Revoke every session for a user (admin force-logout). */
export async function revokeAllSessionsForUser(
  userId: string,
): Promise<number> {
  const deleted = await db
    .delete(sessions)
    .where(eq(sessions.userId, userId))
    .returning({ id: sessions.id });

  logger.info("auth.all_sessions_revoked", {
    userId,
    count: deleted.length,
  });

  return deleted.length;
}

export const getCurrentSession = cache(async (): Promise<{
  sessionId: string;
  user: PublicUser;
} | null> => {
  ensureAuthSecret();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      planId: users.planId,
      blockedAt: users.blockedAt,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  const row = rows[0];

  // Cookie mutation is not allowed during RSC render — only return null here.
  // Expired DB rows are removed; stale cookies are replaced on the next login.
  if (!row) {
    return null;
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  if (row.blockedAt) {
    await db.delete(sessions).where(eq(sessions.userId, row.userId));
    return null;
  }

  return {
    sessionId: row.sessionId,
    user: toPublicUser({
      id: row.userId,
      name: row.name,
      email: row.email,
      role: row.role,
      planId: row.planId,
      createdAt: row.createdAt,
    }),
  };
});

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    logger.warn("auth.require_user_failed");
    redirect("/login");
  }

  return user;
}

export async function requireSession(): Promise<{
  sessionId: string;
  user: PublicUser;
}> {
  const session = await getCurrentSession();

  if (!session) {
    logger.warn("auth.require_session_failed");
    redirect("/login");
  }

  return session;
}
