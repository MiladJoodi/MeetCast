import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { authPrimaryButtonClassName } from "@/components/auth/auth-shell";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reset password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const validToken = Boolean(token && token.trim().length >= 20);

  return (
    <AuthShell>
      <AuthCard className="mx-auto max-w-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/50">MeetCast</p>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-white">
            Reset password
          </h1>
        </div>

        {validToken ? (
          <ResetPasswordForm token={token!.trim()} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-white/55">
              This reset link is missing or incomplete. Request a new one from
              the forgot-password page.
            </p>
            <Button className={cn("w-full", authPrimaryButtonClassName)} asChild>
              <Link href="/forgot-password">Forgot password</Link>
            </Button>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
