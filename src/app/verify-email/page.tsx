import type { Metadata } from "next";
import Link from "next/link";

import {
  AuthCard,
  AuthShell,
  authAlertClassName,
  authNoticeClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verify email",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;
  let ok = false;
  let message =
    "This verification link is invalid or has expired. You can still sign in — confirming email is optional.";

  if (token && token.trim().length >= 20) {
    try {
      const consumed = await consumeAuthToken({
        rawToken: token.trim(),
        type: "email_verify",
      });
      if (consumed) {
        await db
          .update(users)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(users.id, consumed.userId));
        ok = true;
        message =
          "Email confirmed. You’re all set — MeetCast already works with or without this step.";
        logger.info("auth.email_verified", { userId: consumed.userId });
      }
    } catch (error) {
      logger.error("auth.email_verify_failed", {
        error: error instanceof Error ? error.name : "unknown",
      });
      message = "Unable to verify email right now. You can still sign in.";
    }
  }

  return (
    <AuthShell>
      <AuthCard className="mx-auto max-w-md">
        <div className="space-y-3">
          <p className="text-sm font-medium text-white/50">MeetCast</p>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-white">
            {ok ? "Email confirmed" : "Verification"}
          </h1>
          <p
            role="status"
            className={ok ? authNoticeClassName : authAlertClassName}
          >
            {message}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button className={cn("w-full", authPrimaryButtonClassName)} asChild>
            <Link href="/dashboard">Open desk</Link>
          </Button>
          <Button
            variant="outline"
            className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
