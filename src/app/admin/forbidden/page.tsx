import type { Metadata } from "next";

import { BackLink } from "@/components/meetcast/back-link";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin access denied",
};

export default async function AdminForbiddenPage() {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Access denied</h1>
      <p className="text-sm text-muted-foreground">
        You do not have permission to view the Admin Panel.
      </p>
      <BackLink href="/dashboard" label="Dashboard" />
    </div>
  );
}
