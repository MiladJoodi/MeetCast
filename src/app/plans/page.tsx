import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { EmptyState } from "@/components/meetcast/empty-state";
import { PlansComparisonTable } from "@/components/plans/plans-comparison-table";
import { PlansOverview } from "@/components/plans/plans-overview";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { sortPlansForDisplay } from "@/lib/plans/display";
import { getActivePlans, getUserPlan } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Plans",
  description: "Compare MeetCast plans and limits.",
};

export default async function PlansPage() {
  const user = await getCurrentUser();

  let activePlans: Awaited<ReturnType<typeof getActivePlans>> = [];
  let currentPlan: Awaited<ReturnType<typeof getUserPlan>> | null = null;
  let loadError = false;

  try {
    const plans = await getActivePlans();
    activePlans = sortPlansForDisplay(plans);
    if (user) {
      currentPlan = await getUserPlan(user.id);
    }
  } catch (error) {
    loadError = true;
    logger.error("plans.page_load_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  }

  return (
    <MarketingShell
      scrollable
      className="max-w-5xl gap-8 pb-20 pt-20 sm:pt-24"
    >
      <header className="space-y-3">
        <p className="text-sm font-medium text-white/50">Plans</p>
        <h1 className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold tracking-[-0.04em] text-white">
          Pick the room size you need.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-white/55">
          {currentPlan
            ? `You’re on ${currentPlan.name}. Limits update when you order another plan.`
            : "Compare participants and meeting length. Order after you sign in."}
        </p>
      </header>

      {loadError ? (
        <EmptyState
          className="text-white [&_.text-muted-foreground]:text-white/55"
          title="Unable to load plans"
          description="Try again in a moment."
          action={
            <Button
              variant="outline"
              className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              asChild
            >
              <Link href="/">Home</Link>
            </Button>
          }
        />
      ) : activePlans.length === 0 ? (
        <EmptyState
          className="text-white [&_.text-muted-foreground]:text-white/55"
          title="No active plans"
          description="Nothing to compare right now."
        />
      ) : (
        <div className="space-y-10">
          <PlansOverview
            plans={activePlans}
            currentPlanId={currentPlan?.id}
            signedIn={Boolean(user)}
            tone="marketing"
          />
          <PlansComparisonTable
            plans={activePlans}
            currentPlanId={currentPlan?.id}
            signedIn={Boolean(user)}
            tone="marketing"
          />
        </div>
      )}
    </MarketingShell>
  );
}
