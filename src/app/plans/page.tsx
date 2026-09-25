import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingTourNav } from "@/components/marketing/marketing-tour-nav";
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
      className="max-w-5xl gap-10 pb-20 pt-20 sm:pt-24"
    >
      <MarketingPageHeader
        eyebrow="Capacity"
        title="Pick the room size you need."
        description={
          currentPlan
            ? `You’re on ${currentPlan.name}. Limits update when you order another plan.`
            : "Compare participants and meeting length. Order after you sign in — browsing here needs no account."
        }
      />

      {loadError ? (
        <EmptyState
          className="mc-mkt-in-4 text-white [&_.text-muted-foreground]:text-white/55"
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
          className="mc-mkt-in-4 text-white [&_.text-muted-foreground]:text-white/55"
          title="No active plans"
          description="Nothing to compare right now."
        />
      ) : (
        <div className="space-y-12">
          <PlansOverview
            plans={activePlans}
            currentPlanId={currentPlan?.id}
            signedIn={Boolean(user)}
            tone="marketing"
          />
          <div className="mc-mkt-section space-y-4" style={{ animationDelay: "0.45s" }}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-white/40 uppercase">
                  Side by side
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">
                  Full comparison
                </h2>
              </div>
            </div>
            <PlansComparisonTable
              plans={activePlans}
              currentPlanId={currentPlan?.id}
              signedIn={Boolean(user)}
              tone="marketing"
            />
          </div>
        </div>
      )}

      <MarketingTourNav current="/plans" />
    </MarketingShell>
  );
}
