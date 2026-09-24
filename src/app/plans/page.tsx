import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/meetcast/empty-state";
import { PlansComparisonTable } from "@/components/plans/plans-comparison-table";
import { PlansOverview } from "@/components/plans/plans-overview";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { sortPlansForDisplay } from "@/lib/plans/display";
import { getActivePlans, getUserPlan } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Plans",
};

export default async function PlansPage() {
  const user = await requireUser();

  let activePlans: Awaited<ReturnType<typeof getActivePlans>> = [];
  let currentPlan: Awaited<ReturnType<typeof getUserPlan>> | null = null;
  let loadError = false;

  try {
    const [plans, plan] = await Promise.all([
      getActivePlans(),
      getUserPlan(user.id),
    ]);
    activePlans = sortPlansForDisplay(plans);
    currentPlan = plan;
  } catch (error) {
    loadError = true;
    logger.error("plans.page_load_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
          Plans
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentPlan
            ? `You’re on ${currentPlan.name}.`
            : "Compare what’s included on each plan."}
        </p>
      </header>

      {loadError ? (
        <EmptyState
          title="Unable to load plans"
          description="Try again in a moment."
          action={
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          }
        />
      ) : activePlans.length === 0 ? (
        <EmptyState
          title="No active plans"
          description="Nothing to compare right now."
        />
      ) : (
        <div className="space-y-8">
          <PlansOverview
            plans={activePlans}
            currentPlanId={currentPlan?.id}
          />
          <PlansComparisonTable
            plans={activePlans}
            currentPlanId={currentPlan?.id}
          />
        </div>
      )}
    </div>
  );
}
