import "server-only";

import { getOptionalEnv } from "@/lib/env";
import { getAppOrigin } from "@/lib/payments/app-origin";
import { logger } from "@/lib/logger";

export type SendEmailResult =
  | { ok: true; delivered: true }
  | { ok: true; delivered: false; reason: "not_configured" | "send_failed" };

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = getOptionalEnv("RESEND_API_KEY");
  if (!apiKey) return null;
  const from =
    getOptionalEnv("RESEND_FROM_EMAIL") ||
    "MeetCast <onboarding@resend.dev>";
  return { apiKey, from };
}

export function isEmailConfigured(): boolean {
  return Boolean(getOptionalEnv("RESEND_API_KEY"));
}

export function absoluteAppUrl(path: string): string {
  const origin = getAppOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendEmailResult> {
  const config = getResendConfig();
  if (!config) {
    logger.info("email.skipped_not_configured", { toDomain: input.to.split("@")[1] });
    return { ok: true, delivered: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error("email.send_failed", {
        status: response.status,
        body: body.slice(0, 200),
      });
      return { ok: true, delivered: false, reason: "send_failed" };
    }

    logger.info("email.sent", { subject: input.subject });
    return { ok: true, delivered: true };
  } catch (error) {
    logger.error("email.send_error", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return { ok: true, delivered: false, reason: "send_failed" };
  }
}

export async function sendVerifyEmail(input: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<SendEmailResult> {
  const subject = "Confirm your MeetCast email";
  const text = `Hi ${input.name},\n\nConfirm your email (optional — you can already sign in):\n${input.verifyUrl}\n\nThis link expires in 48 hours.\n\n— MeetCast`;
  const html = `<p>Hi ${escapeHtml(input.name)},</p>
<p>Confirm your email (optional — you can already sign in):</p>
<p><a href="${escapeAttr(input.verifyUrl)}">${escapeHtml(input.verifyUrl)}</a></p>
<p style="color:#666">This link expires in 48 hours.</p>
<p>— MeetCast</p>`;
  return sendViaResend({ to: input.to, subject, text, html });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<SendEmailResult> {
  const subject = "Reset your MeetCast password";
  const text = `Hi ${input.name},\n\nReset your password:\n${input.resetUrl}\n\nThis link expires in 1 hour. If you didn’t ask for this, ignore the email.\n\n— MeetCast`;
  const html = `<p>Hi ${escapeHtml(input.name)},</p>
<p>Reset your password:</p>
<p><a href="${escapeAttr(input.resetUrl)}">${escapeHtml(input.resetUrl)}</a></p>
<p style="color:#666">This link expires in 1 hour. If you didn’t ask for this, ignore the email.</p>
<p>— MeetCast</p>`;
  return sendViaResend({ to: input.to, subject, text, html });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

/** When email isn’t delivered, expose the action link outside production. */
export function shouldExposeEmailFallbackLink(): boolean {
  return process.env.NODE_ENV !== "production";
}
