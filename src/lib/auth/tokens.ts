import "server-only";

import { randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { authTokens, type AuthTokenType } from "@/db/schema";
import { hashAuthToken } from "@/lib/auth/token-hash";

const VERIFY_TTL_MS = 48 * 60 * 60_000;
const RESET_TTL_MS = 60 * 60_000;

export { hashAuthToken } from "@/lib/auth/token-hash";

function ttlForType(type: AuthTokenType): number {
  return type === "password_reset" ? RESET_TTL_MS : VERIFY_TTL_MS;
}

/** Invalidate unused tokens of this type, then mint a new one. Returns raw token. */
export async function issueAuthToken(input: {
  userId: string;
  type: AuthTokenType;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  await db
    .delete(authTokens)
    .where(
      and(
        eq(authTokens.userId, input.userId),
        eq(authTokens.type, input.type),
        isNull(authTokens.usedAt),
      ),
    );

  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlForType(input.type));

  await db.insert(authTokens).values({
    userId: input.userId,
    type: input.type,
    tokenHash: hashAuthToken(rawToken),
    expiresAt,
  });

  return { rawToken, expiresAt };
}

export async function consumeAuthToken(input: {
  rawToken: string;
  type: AuthTokenType;
}): Promise<{ userId: string } | null> {
  const tokenHash = hashAuthToken(input.rawToken);
  const rows = await db
    .select({
      id: authTokens.id,
      userId: authTokens.userId,
      expiresAt: authTokens.expiresAt,
      usedAt: authTokens.usedAt,
    })
    .from(authTokens)
    .where(
      and(eq(authTokens.tokenHash, tokenHash), eq(authTokens.type, input.type)),
    )
    .limit(1);

  const row = rows[0];
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(eq(authTokens.id, row.id));

  return { userId: row.userId };
}
