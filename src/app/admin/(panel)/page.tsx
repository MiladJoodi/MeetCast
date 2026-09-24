import type { Metadata } from "next";

import { AdminOverview } from "@/components/admin/admin-overview";
import { getAdminOverviewStats } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  return <AdminOverview stats={stats} />;
}
