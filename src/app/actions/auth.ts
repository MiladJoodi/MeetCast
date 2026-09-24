"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  invalidateCurrentSession,
} from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/auth/redirect";
import { consumeAuthToken, issueAuthToken } from "@/lib/auth/tokens";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";
import {
  absoluteAppUrl,
  sendPasswordResetEmail,
  sendVerifyEmail,
  shouldExposeEmailFallbackLink,
} from "@/lib/email/send";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getFreePlan } from "@/lib/plans/queries";
import { clearGuestSession } from "@/lib/rooms/guest";
import {
  assertForgotPasswordRateLimits,
  assertLoginRateLimits,
  assertRegisterRateLimit,
  recordLoginFailure,
} from "@/lib/security/rate-limit";

export type AuthActionState = {
  ok: boolean;
  message?: string;
  /** Present when email wasn’t delivered and a fallback link is safe to show. */
  fallbackLink?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Precomputed Argon2id hash of a fixed dummy password.
 * Used when the email is unknown so login timing stays similar.
 */
const TIMING_DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$JJJKRkMjBjq2EF7GGwOa+A$SSB8Eh2InDm1rnjeVOTipRwe3v9whvSb4Q/mFgTwiT8";

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

const GENERIC_REGISTER_FAILURE =
  "Unable to create your account. Please try again.";

async function sendVerificationForUser(input: {
  userId: string;
  email: string;
  name: string;
}): Promise<{ delivered: boolean; fallbackLink?: string }> {
  const { rawToken } = await issueAuthToken({
    userId: input.userId,
    type: "email_verify",
  });
  const verifyUrl = absoluteAppUrl(
    `/verify-email?token=${encodeURIComponent(rawToken)}`,
  );
  const result = await sendVerifyEmail({
    to: input.email,
    name: input.name,
    verifyUrl,
  });
  if (result.delivered) {
    return { delivered: true };
  }
  if (shouldExposeEmailFallbackLink()) {
    return { delivered: false, fallbackLink: verifyUrl };
  }
  return { delivered: false };
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { name, email, password } = parsed.data;
  const nextPath = safeInternalPath(formString(formData, "next"));

  let mailStatus: "sent" | "skipped" = "skipped";

  try {
    await assertRegisterRateLimit();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing[0]) {
      logger.info("auth.register_duplicate_email");
      return {
        ok: false,
        message: GENERIC_REGISTER_FAILURE,
      };
    }

    const passwordHash = await hashPassword(password);
    const freePlan = await getFreePlan();

    const created = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        planId: freePlan.id,
      })
      .returning({
        id: users.id,
      });

    const user = created[0];
    if (!user) {
      throw new Error("User insert returned no row");
    }

    await createSession(user.id);
    logger.info("auth.register_success", { userId: user.id });

    // Non-blocking: account is active even if email fails or isn’t configured.
    try {
      const mail = await sendVerificationForUser({
        userId: user.id,
        email,
        name,
      });
      mailStatus = mail.delivered ? "sent" : "skipped";
      if (mail.fallbackLink) {
        logger.info("auth.verify_email_fallback", {
          userId: user.id,
          // Log path only — full token stays in verify URL for local testing via Resend or logs of send module
        });
      }
    } catch (error) {
      logger.error("auth.verify_email_enqueue_failed", {
        error: error instanceof Error ? error.name : "unknown",
      });
      mailStatus = "skipped";
    }
  } catch (error) {
    if (error instanceof AppError && error.code === "RATE_LIMITED") {
      return { ok: false, message: error.message };
    }

    const duplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505";

    if (duplicate) {
      logger.info("auth.register_duplicate_email");
      return {
        ok: false,
        message: GENERIC_REGISTER_FAILURE,
      };
    }

    logger.error("auth.register_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      message: GENERIC_REGISTER_FAILURE,
    };
  }

  const doneParams = new URLSearchParams({ mail: mailStatus });
  if (nextPath) doneParams.set("next", nextPath);
  redirect(`/register/done?${doneParams.toString()}`);
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { email, password } = parsed.data;
  const invalidCredentials: AuthActionState = {
    ok: false,
    message: "Invalid email or password.",
  };
  const nextPath = safeInternalPath(formString(formData, "next"));

  try {
    await assertLoginRateLimits(email);

    const rows = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        blockedAt: users.blockedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = rows[0];

    if (!user) {
      await verifyPassword(TIMING_DUMMY_PASSWORD_HASH, password);
      await recordLoginFailure(email);
      logger.info("auth.login_failed", { reason: "unknown_email" });
      return invalidCredentials;
    }

    const passwordValid = await verifyPassword(user.passwordHash, password);

    if (!passwordValid) {
      await recordLoginFailure(email);
      logger.info("auth.login_failed", {
        reason: "bad_password",
        userId: user.id,
      });
      return invalidCredentials;
    }

    if (user.blockedAt) {
      logger.info("auth.login_failed", {
        reason: "blocked",
        userId: user.id,
      });
      return {
        ok: false,
        message:
          "This account has been blocked. Contact support if you need help.",
      };
    }

    await createSession(user.id);
    logger.info("auth.login_success", { userId: user.id });
  } catch (error) {
    if (error instanceof AppError && error.code === "RATE_LIMITED") {
      return { ok: false, message: "Invalid email or password." };
    }

    logger.error("auth.login_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      message: "Unable to log in. Please try again.",
    };
  }

  redirect(nextPath ?? "/dashboard");
}

export async function logoutAction(): Promise<void> {
  try {
    await invalidateCurrentSession();
    await clearGuestSession();
    logger.info("auth.logout_success");
  } catch (error) {
    logger.error("auth.logout_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  }
  redirect("/login");
}

/**
 * Always returns a success-style message (no email enumeration).
 * If email isn’t configured, may include a fallback reset link outside production.
 */
export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formString(formData, "email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { email } = parsed.data;
  const genericOk: AuthActionState = {
    ok: true,
    message:
      "If an account exists for that email, a reset link is on the way. You can still sign in with your current password until you reset it.",
  };

  try {
    await assertForgotPasswordRateLimits(email);

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        blockedAt: users.blockedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = rows[0];
    if (!user || user.blockedAt) {
      return genericOk;
    }

    const { rawToken } = await issueAuthToken({
      userId: user.id,
      type: "password_reset",
    });
    const resetUrl = absoluteAppUrl(
      `/reset-password?token=${encodeURIComponent(rawToken)}`,
    );
    const result = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    if (result.delivered) {
      return genericOk;
    }

    if (shouldExposeEmailFallbackLink()) {
      return {
        ok: true,
        message:
          "Email isn’t configured on this server yet, so nothing was sent. Use the reset link below — your account stays usable.",
        fallbackLink: resetUrl,
      };
    }

    return {
      ok: true,
      message:
        "Email isn’t configured on this server yet, so nothing was sent. Contact support for a reset, or try again after Resend is set up. Your account still works.",
    };
  } catch (error) {
    if (error instanceof AppError && error.code === "RATE_LIMITED") {
      return { ok: false, message: error.message };
    }
    logger.error("auth.forgot_password_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return genericOk;
  }
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formString(formData, "token"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { token, password } = parsed.data;

  try {
    const consumed = await consumeAuthToken({
      rawToken: token,
      type: "password_reset",
    });
    if (!consumed) {
      return {
        ok: false,
        message: "This reset link is invalid or has expired. Request a new one.",
      };
    }

    const passwordHash = await hashPassword(password);
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, consumed.userId));

    await createSession(consumed.userId);
    logger.info("auth.password_reset_success", { userId: consumed.userId });
  } catch (error) {
    logger.error("auth.password_reset_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      message: "Unable to reset password. Please try again.",
    };
  }

  redirect("/dashboard");
}
