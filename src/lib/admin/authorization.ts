import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users, type PublicUser } from "@/db/schema";
import { assertIsAdmin, isAdmin } from "@/lib/admin/policy";
import { normalizeEmail } from "@/lib/auth/validation";
import { getOptionalEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getCurrentSession, toPublicUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export function parseAdminEmails(raw: string | undefined): Set<string> {
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((part) => normalizeEmail(part))
      .filter((email) => email.length > 0),
  );
}

async function promoteIfBootstrapAdmin(user: PublicUser): Promise<PublicUser> {
  if (isAdmin(user)) {
    return user;
  }

  const allowlist = parseAdminEmails(getOptionalEnv("ADMIN_EMAILS"));
  if (!allowlist.has(normalizeEmail(user.email))) {
    return user;
  }

  await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.id, user.id));

  logger.info("admin.bootstrap_promoted", { userId: user.id });

  return toPublicUser({
    id: user.id,
    name: user.name,
    email: user.email,
    role: "admin",
    planId: user.planId,
    createdAt: user.createdAt,
  });
}

/**
 * Require an authenticated admin. Unauthenticated → /login.
 * Non-admin → /admin/forbidden.
 */
export async function requireAdmin(): Promise<{
  sessionId: string;
  user: PublicUser;
}> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const user = await promoteIfBootstrapAdmin(session.user);

  try {
    assertIsAdmin(user);
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      redirect("/admin/forbidden");
    }
    throw error;
  }

  return { sessionId: session.sessionId, user };
}

export async function countAdmins(): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));
  return rows.length;
}
