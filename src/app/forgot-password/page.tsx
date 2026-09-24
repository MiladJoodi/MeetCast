import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <AuthCard className="mx-auto max-w-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/50">MeetCast</p>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-white">
            Forgot password
          </h1>
          <p className="text-sm text-white/55">
            Enter your account email. We’ll send a reset link when email is
            configured — your account stays usable either way.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-white/55">
          <Link
            href="/login"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Back to log in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
