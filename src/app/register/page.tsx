import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Create account",
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { next: nextRaw } = await searchParams;
  const nextPath = safeInternalPath(nextRaw);

  const user = await getCurrentUser();
  if (user) redirect(nextPath ?? "/dashboard");

  return (
    <AuthShell>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
        <div className="hidden lg:block">
          <p className="text-sm font-medium text-white/50">MeetCast</p>
          <h1 className="mt-3 max-w-[14ch] text-[clamp(1.85rem,4vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
            Host a room in a few minutes.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            Create an account, schedule a meeting, and share the invite when
            you&apos;re ready.
          </p>
        </div>
        <AuthCard className="mx-auto max-w-sm lg:mx-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/50 lg:hidden">
              MeetCast
            </p>
            <h1 className="text-xl font-semibold tracking-[-0.03em] text-white">
              Create account
            </h1>
          </div>
          <RegisterForm nextPath={nextPath} />
          <p className="text-sm text-white/45">
            By creating an account you agree to our{" "}
            <Link
              href="/terms"
              className="font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Privacy
            </Link>
            .
          </p>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
