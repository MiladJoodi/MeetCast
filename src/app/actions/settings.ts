"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  getCurrentSession,
  invalidateCurrentSession,
  requireSession,
  revokeOtherSessions,
  revokeSessionForUser,
} from "@/lib/auth/session";
import {
  changePasswordSchema,
  deleteAccountSchema,
  revokeSessionSchema,
  updateProfileSchema,
} from "@/lib/auth/validation";
import { toSafeClientError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { clearGuestSession } from "@/lib/rooms/guest";
import {
  assertAccountDeleteRateLimit,
  assertPasswordChangeRateLimit,
} from "@/lib/security/rate-limit";
import { deleteUserAccount } from "@/lib/users/delete-account";

export type SettingsActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten();
  const fieldErrors = flattened.fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const result: Record<string, string[]> = {};

  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[key] = messages;
    }
  }

  return result;
}

function actionError(error: unknown): SettingsActionState {
  const safe = toSafeClientError(error);
  return {
    ok: false,
    message: safe.message,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function updateProfileAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { user } = await requireSession();

  const parsed = updateProfileSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { name, email } = parsed.data;

  try {
    if (email !== user.email) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing[0] && existing[0].id !== user.id) {
        return {
          ok: false,
          fieldErrors: {
            email: ["This email is already in use."],
          },
        };
      }
    }

    await db
      .update(users)
      .set({ name, email })
      .where(eq(users.id, user.id));

    logger.info("settings.profile_updated", { userId: user.id });
    return { ok: true, message: "Profile updated." };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: {
          email: ["This email is already in use."],
        },
      };
    }
    logger.error("settings.profile_update_failed", {
      userId: user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return actionError(error);
  }
}

export async function changePasswordAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { user, sessionId } = await requireSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
    newPassword: formString(formData, "newPassword"),
    confirmNewPassword: formString(formData, "confirmNewPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    await assertPasswordChangeRateLimit(user.id);

    const rows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return { ok: false, message: "Unable to change password." };
    }

    const valid = await verifyPassword(row.passwordHash, currentPassword);
    if (!valid) {
      return {
        ok: false,
        message: "Current password is incorrect.",
        fieldErrors: {
          currentPassword: ["Current password is incorrect."],
        },
      };
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    await revokeOtherSessions(user.id, sessionId);

    logger.info("settings.password_changed", { userId: user.id });
    return {
      ok: true,
      message: "Password updated. Other sessions have been signed out.",
    };
  } catch (error) {
    logger.error("settings.password_change_failed", {
      userId: user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return actionError(error);
  }
}

export async function revokeSessionAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { user, sessionId: currentSessionId } = await requireSession();

  const parsed = revokeSessionSchema.safeParse({
    sessionId: formString(formData, "sessionId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid session.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    await revokeSessionForUser({
      userId: user.id,
      sessionId: parsed.data.sessionId,
      currentSessionId,
    });
    return { ok: true, message: "Session revoked." };
  } catch (error) {
    logger.error("settings.revoke_session_failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }
}

export async function revokeOtherSessionsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  void formData;
  const { user, sessionId } = await requireSession();

  try {
    const count = await revokeOtherSessions(user.id, sessionId);
    return {
      ok: true,
      message:
        count === 0
          ? "No other sessions to revoke."
          : `Signed out ${count} other session${count === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    logger.error("settings.revoke_other_sessions_failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }
}

export async function deleteAccountAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  const parsed = deleteAccountSchema.safeParse({
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please confirm your password.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    await assertAccountDeleteRateLimit(user.id);

    const rows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return { ok: false, message: "Unable to delete account." };
    }

    const valid = await verifyPassword(row.passwordHash, parsed.data.password);
    if (!valid) {
      return {
        ok: false,
        message: "Password is incorrect.",
        fieldErrors: {
          password: ["Password is incorrect."],
        },
      };
    }

    await deleteUserAccount(user.id);

    await invalidateCurrentSession();
    await clearGuestSession();

    logger.info("settings.account_deleted", { userId: user.id });
  } catch (error) {
    logger.error("settings.account_delete_failed", {
      userId: user.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    return actionError(error);
  }

  redirect("/login");
}
