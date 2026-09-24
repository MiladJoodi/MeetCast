import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccentPalettePicker } from "@/components/settings/accent-palette-picker";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { SessionsPanel } from "@/components/settings/sessions-panel";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import {
  getCurrentSession,
  listUserSessions,
  requireUser,
} from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const [current, sessionRows, hostedCountRows] = await Promise.all([
    getCurrentSession(),
    listUserSessions(user.id),
    db
      .select({ value: count() })
      .from(rooms)
      .where(eq(rooms.hostUserId, user.id)),
  ]);
  const hostedRoomCount = Number(hostedCountRows[0]?.value ?? 0);

  const sessions = sessionRows.map((session) => ({
    id: session.id,
    createdAtIso: session.createdAt.toISOString(),
    expiresAtIso: session.expiresAt.toISOString(),
    isCurrent: current?.sessionId === session.id,
  }));

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Profile, security, and account.
        </p>
      </header>

      <SettingsWorkspace
        sections={[
          {
            id: "profile",
            label: "Profile",
            content: <ProfileForm name={user.name} email={user.email} />,
          },
          {
            id: "appearance",
            label: "Appearance",
            content: (
              <div className="space-y-8">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Mode</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Switch between light and dark.
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
                <AccentPalettePicker />
              </div>
            ),
          },
          {
            id: "password",
            label: "Password",
            content: (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Changing password signs out other devices.
                </p>
                <ChangePasswordForm />
              </div>
            ),
          },
          {
            id: "sessions",
            label: "Sessions",
            content: (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Active sign-ins for your account.
                </p>
                <SessionsPanel sessions={sessions} />
              </div>
            ),
          },
          {
            id: "account",
            label: "Danger",
            content: (
              <div className="border-l-[3px] border-danger pl-4">
                <p className="text-sm font-medium text-danger">
                  Delete account
                </p>
                <p className="mt-1 mb-3 text-sm text-muted-foreground">
                  Permanently removes your account and hosted rooms.
                </p>
                <DeleteAccountForm hostedRoomCount={hostedRoomCount} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
