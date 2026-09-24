import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CreatePlanDialog } from "@/components/admin/create-plan-dialog";
import { EmptyState } from "@/components/meetcast/empty-state";
import { countUsersByPlanId, getAllPlans } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Admin plans",
};

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "Unlimited";
  return `${minutes} min`;
}

export default async function AdminPlansPage() {
  const [plans, countMap] = await Promise.all([
    getAllPlans(),
    countUsersByPlanId(),
  ]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Plans</h2>
          <CreatePlanDialog />
        </div>
        <p className="text-sm text-muted-foreground">
          {plans.length} plan{plans.length === 1 ? "" : "s"}
        </p>
      </header>

      {plans.length === 0 ? (
        <EmptyState
          title="No plans"
          description="Create a plan to assign limits to users."
          action={<CreatePlanDialog />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5 font-medium sm:px-4">Plan</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Slug
                </th>
                <th className="px-3 py-2.5 text-center font-medium sm:px-4">
                  Limits
                </th>
                <th className="w-8 px-2 py-2.5 sm:px-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const users = countMap.get(plan.id) ?? 0;
                return (
                  <tr
                    key={plan.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/35"
                  >
                    <td className="px-3 py-2.5 sm:px-4">
                      <Link
                        href={`/admin/plans/${plan.id}`}
                        className="flex min-w-0 items-center gap-2"
                      >
                        <span className="truncate font-semibold tracking-tight">
                          {plan.name}
                        </span>
                        <span
                          className={
                            plan.isActive
                              ? "shrink-0 rounded-md bg-success/15 px-1.5 py-0.5 text-[0.7rem] font-medium text-success"
                              : "shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground"
                          }
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </Link>
                    </td>
                    <td className="hidden max-w-[9rem] truncate px-3 py-2.5 text-muted-foreground sm:table-cell sm:px-4">
                      <Link
                        href={`/admin/plans/${plan.id}`}
                        className="block truncate"
                      >
                        {plan.slug}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-xs tabular-nums text-muted-foreground sm:px-4 sm:text-sm">
                      <Link href={`/admin/plans/${plan.id}`} className="block">
                        {plan.maxConcurrentParticipants} people
                        <span className="mx-1 text-border">·</span>
                        {formatDuration(plan.maxRoomDurationMinutes)}
                        <span className="mx-1 text-border">·</span>
                        {users} user{users === 1 ? "" : "s"}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 sm:px-3">
                      <Link
                        href={`/admin/plans/${plan.id}`}
                        className="flex justify-end"
                        aria-label={`Open ${plan.name}`}
                      >
                        <ChevronRight
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
