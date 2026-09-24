import { requireUser } from "@/lib/auth/session";

import { AppShell } from "@/components/layout/app-shell";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  return (
    <AppShell user={{ name: user.name, role: user.role }}>{children}</AppShell>
  );
}
