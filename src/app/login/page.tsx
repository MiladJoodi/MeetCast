import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard, AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Log in",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next: nextRaw } = await searchParams;
  const nextPath = safeInternalPath(nextRaw);

  const user = await getCurrentUser();
  if (user) redirect(nextPath ?? "/dashboard");

  return (
    <AuthShell>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
        <div className="hidden lg:block">
          <p className="text-sm font-medium text-white/50">MeetCast</p>
          <h1 className="mt-3 max-w-[12ch] text-[clamp(1.85rem,4vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
            Back to your rooms.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            Manage schedules, invites, and live meetings from one place.
          </p>
        </div>
        <AuthCard className="mx-auto max-w-sm lg:mx-0">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/50 lg:hidden">
              MeetCast
            </p>
            <h1 className="text-xl font-semibold tracking-[-0.03em] text-white">
              Log in
            </h1>
          </div>
          <LoginForm nextPath={nextPath} />
        </AuthCard>
      </div>
    </AuthShell>
  );
}
