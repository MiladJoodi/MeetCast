import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AuthCard,
  AuthShell,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Account ready",
};

type RegisterDonePageProps = {
  searchParams: Promise<{ mail?: string; next?: string }>;
};

export default async function RegisterDonePage({
  searchParams,
}: RegisterDonePageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { mail, next: nextRaw } = await searchParams;
  const nextPath = safeInternalPath(nextRaw) ?? "/dashboard";
  const emailSent = mail === "sent";

  return (
    <AuthShell>
      <AuthCard className="mx-auto max-w-md">
        <div className="space-y-3">
          <p className="text-sm font-medium text-white/50">MeetCast</p>
          <h1 className="text-xl font-semibold tracking-[-0.03em] text-white">
            You’re in
          </h1>
          {emailSent ? (
            <p className="text-sm leading-relaxed text-white/65">
              A confirmation email was sent to{" "}
              <span className="text-white/90">{user.email}</span>. Confirming is
              optional — your account is already active and you can use
              MeetCast now.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-white/65">
              We couldn’t send a confirmation email yet (email delivery isn’t
              configured on this server). Your account is still active — you
              can log in and use MeetCast normally.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button className={cn("w-full", authPrimaryButtonClassName)} asChild>
            <Link href={nextPath}>Continue</Link>
          </Button>
          <Button
            variant="outline"
            className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/login">Log in instead</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
