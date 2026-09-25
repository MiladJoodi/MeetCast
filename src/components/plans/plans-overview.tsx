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
  signedIn?: boolean;
  tone?: "default" | "marketing";
};

export function PlansOverview({
  plans,
  currentPlanId,
  signedIn = true,
  tone = "default",
}: PlansOverviewProps) {
  if (plans.length === 0) return null;

  const marketing = tone === "marketing";

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan, index) => {
        const isCurrent = isCurrentUserPlan(plan, currentPlanId);
        const durationNote = formatPlanDurationNote(plan);

        return (
          <article
            key={plan.id}
            className={cn(
              "flex flex-col gap-4 rounded-xl p-5",
              marketing
                ? "mc-mkt-card border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)]"
                : "border border-border/80 bg-surface-elevated",
              isCurrent &&
                (marketing
                  ? "mc-mkt-card-current border-[color-mix(in_oklch,var(--live)_55%,white)]/40"
                  : "border-brand/30 bg-brand-soft/25"),
            )}
            style={
              marketing
                ? { animationDelay: `${0.22 + index * 0.07}s` }
                : undefined
            }
          >
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h2
                  className={cn(
                    "text-lg font-semibold tracking-tight",
                    marketing && "text-white",
                  )}
                >
                  {plan.name}
                </h2>
                {isCurrent ? (
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      marketing ? "text-[var(--live)]" : "text-brand",
                    )}
                  >
                    Current
                  </span>
                ) : null}
              </div>
              {plan.description ? (
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    marketing ? "text-white/55" : "text-muted-foreground",
                  )}
                >
                  {plan.description}
                </p>
              ) : null}
              <p
                className={cn(
                  "pt-1 text-base font-semibold tabular-nums",
                  marketing && "text-white",
                )}
              >
                {formatPlanPrice(plan.priceAmount, plan.currency)}
              </p>
            </div>

            <dl className="mt-auto space-y-3 text-sm">
              <div
                className={cn(
                  "border-t pt-3",
                  marketing ? "border-white/10" : "border-border/70",
                )}
              >
                <dt
                  className={
                    marketing ? "text-white/45" : "text-muted-foreground"
                  }
                >
                  Participants
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 text-base font-semibold tabular-nums",
                    marketing && "text-white",
                  )}
                >
                  {plan.maxConcurrentParticipants}
                </dd>
              </div>
              <div>
                <dt
                  className={
                    marketing ? "text-white/45" : "text-muted-foreground"
                  }
                >
                  Duration
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 text-base font-semibold",
                    marketing && "text-white",
                  )}
                >
                  {formatPlanDurationDisplay(plan)}
                </dd>
                {durationNote ? (
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      marketing ? "text-white/45" : "text-muted-foreground",
                    )}
                  >
                    {durationNote}
                  </p>
                ) : null}
              </div>
            </dl>

            <OrderPlanButton
              planId={plan.id}
              isCurrent={isCurrent}
              canPurchase={isPlanPurchasableOnline(plan)}
              signedIn={signedIn}
              className={cn(
                "w-full",
                marketing &&
                  !isCurrent &&
                  "border-transparent bg-white text-black hover:bg-white/90",
                marketing &&
                  isCurrent &&
                  "border-white/20 bg-transparent text-white/70",
              )}
            />
          </article>
        );
      })}
    </section>
  );
}
