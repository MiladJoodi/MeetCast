import { AdminNav } from "@/components/admin/admin-nav";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/admin/authorization";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await requireAdmin();

  return (
    <AppShell user={{ name: user.name, role: user.role }}>
      <div className="flex flex-1 flex-col gap-6 p-5 sm:p-7">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
            Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Users, rooms, plans, and audit trail.
          </p>
        </header>
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppShell>
  );
}
