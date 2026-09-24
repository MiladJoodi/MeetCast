import type { Plan } from "@/db/schema";
import { OrderPlanButton } from "@/components/plans/order-plan-button";
import { isPlanPurchasableOnline } from "@/lib/payments/constants";
import { formatPlanPrice } from "@/lib/payments/format";
import {
  formatPlanDurationDisplay,
  formatPlanDurationNote,
  isCurrentUserPlan,
} from "@/lib/plans/display";
import { cn } from "@/lib/utils";

type PlansOverviewProps = {
  plans: Plan[];
  currentPlanId?: string | null;
};

export function PlansOverview({ plans, currentPlanId }: PlansOverviewProps) {
  if (plans.length === 0) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => {
        const isCurrent = isCurrentUserPlan(plan, currentPlanId);
        const durationNote = formatPlanDurationNote(plan);

        return (
          <article
            key={plan.id}
            className={cn(
              "flex flex-col gap-4 rounded-xl border border-border/80 bg-surface-elevated p-5",
              isCurrent && "border-brand/30 bg-brand-soft/25",
            )}
          >
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {plan.name}
                </h2>
                {isCurrent ? (
                  <span className="shrink-0 text-xs text-brand">Current</span>
                ) : null}
              </div>
              {plan.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
              ) : null}
              <p className="pt-1 text-base font-semibold tabular-nums">
                {formatPlanPrice(plan.priceAmount, plan.currency)}
              </p>
            </div>

            <dl className="mt-auto space-y-3 text-sm">
              <div className="border-t border-border/70 pt-3">
                <dt className="text-muted-foreground">Participants</dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  {plan.maxConcurrentParticipants}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="mt-0.5 text-base font-semibold">
                  {formatPlanDurationDisplay(plan)}
                </dd>
                {durationNote ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {durationNote}
                  </p>
                ) : null}
              </div>
            </dl>

            <OrderPlanButton
              planId={plan.id}
              isCurrent={isCurrent}
              canPurchase={isPlanPurchasableOnline(plan)}
              className="w-full"
            />
          </article>
        );
      })}
    </section>
  );
}
