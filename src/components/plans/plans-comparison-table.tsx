import { Fragment } from "react";
import { Check, Infinity } from "lucide-react";

import type { Plan } from "@/db/schema";
import { OrderPlanButton } from "@/components/plans/order-plan-button";
import { isPlanPurchasableOnline } from "@/lib/payments/constants";
import { formatPlanPrice } from "@/lib/payments/format";
import {
  buildPlanComparisonRows,
  isCurrentUserPlan,
  type PlanComparisonRow,
} from "@/lib/plans/display";
import { cn } from "@/lib/utils";

type PlansComparisonTableProps = {
  plans: Plan[];
  currentPlanId?: string | null;
};

function groupRows(rows: PlanComparisonRow[]) {
  const groups: Array<{ name: string; rows: PlanComparisonRow[] }> = [];
  for (const row of rows) {
    const name = row.group ?? "Features";
    const last = groups[groups.length - 1];
    if (last && last.name === name) {
      last.rows.push(row);
    } else {
      groups.push({ name, rows: [row] });
    }
  }
  return groups;
}

function PlanCellValue({ value }: { value: string }) {
  if (value === "✓") {
    return (
      <span
        className="inline-flex items-center justify-center text-success"
        title="Included"
      >
        <Check className="size-4" strokeWidth={2.5} aria-label="Included" />
      </span>
    );
  }
  if (value === "Unlimited") {
    return (
      <span
        className="inline-flex items-center justify-center gap-1.5 text-foreground"
        title="Unlimited"
      >
        <Infinity className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        <span>Unlimited</span>
      </span>
    );
  }
  return <>{value}</>;
}

export function PlansComparisonTable({
  plans,
  currentPlanId,
}: PlansComparisonTableProps) {
  if (plans.length === 0) return null;

  const rows = buildPlanComparisonRows(plans);
  const groups = groupRows(rows);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        Full comparison
      </h2>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {plans.map((plan, planIndex) => {
          const isCurrent = isCurrentUserPlan(plan, currentPlanId);
          return (
            <article
              key={plan.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border/80 bg-surface-elevated",
                isCurrent && "border-brand/30 bg-brand-soft/25",
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
                <h3 className="font-semibold tracking-tight">{plan.name}</h3>
                {isCurrent ? (
                  <span className="text-xs text-brand">Current</span>
                ) : null}
              </div>
              {groups.map((group) => (
                <div
                  key={group.name}
                  className="border-b border-border/70 last:border-0"
                >
                  <p className="bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                    {group.name}
                  </p>
                  <dl className="px-4">
                    {group.rows.map((row) => (
                      <div
                        key={row.feature}
                        className="flex justify-between gap-4 border-b border-border/50 py-2.5 last:border-0"
                      >
                        <dt className="text-sm text-muted-foreground">
                          {row.feature}
                        </dt>
                        <dd className="text-sm font-medium tabular-nums">
                          <PlanCellValue value={row.values[planIndex] ?? ""} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <div className="space-y-2 border-t border-border/70 px-4 py-3">
                <p className="text-sm font-semibold tabular-nums">
                  {formatPlanPrice(plan.priceAmount, plan.currency)}
                </p>
                <OrderPlanButton
                  planId={plan.id}
                  isCurrent={isCurrent}
                  canPurchase={isPlanPurchasableOnline(plan)}
                  className="w-full"
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-border/80 md:block">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground"
              >
                Feature
              </th>
              {plans.map((plan) => {
                const isCurrent = isCurrentUserPlan(plan, currentPlanId);
                return (
                  <th
                    key={plan.id}
                    scope="col"
                    className={cn(
                      "px-4 py-3 font-semibold tracking-tight",
                      isCurrent && "bg-brand-soft/40 text-brand",
                    )}
                  >
                    {plan.name}
                    {isCurrent ? (
                      <span className="mt-0.5 block text-xs font-normal">
                        Current
                      </span>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.name}>
                <tr>
                  <th
                    colSpan={plans.length + 1}
                    className="bg-muted/25 px-4 py-2 text-left text-xs font-medium text-muted-foreground"
                  >
                    {group.name}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-border/60 last:border-0"
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-background px-4 py-3 font-medium text-muted-foreground"
                    >
                      {row.feature}
                    </th>
                    {row.values.map((value, index) => {
                      const plan = plans[index];
                      const isCurrent = plan
                        ? isCurrentUserPlan(plan, currentPlanId)
                        : false;
                      return (
                        <td
                          key={`${row.feature}-${plan?.id ?? index}`}
                          className={cn(
                            "px-4 py-3 text-center tabular-nums",
                            isCurrent && "bg-brand-soft/20",
                          )}
                        >
                          <PlanCellValue value={value} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr className="border-t border-border bg-muted/15">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-muted/15 px-4 py-4 text-sm font-medium text-muted-foreground"
              >
                Price
              </th>
              {plans.map((plan) => {
                const isCurrent = isCurrentUserPlan(plan, currentPlanId);
                return (
                  <td
                    key={`order-${plan.id}`}
                    className={cn(
                      "space-y-2 px-4 py-4 align-bottom",
                      isCurrent && "bg-brand-soft/20",
                    )}
                  >
                    <p className="text-center text-sm font-semibold tabular-nums">
                      {formatPlanPrice(plan.priceAmount, plan.currency)}
                    </p>
                    <OrderPlanButton
                      planId={plan.id}
                      isCurrent={isCurrent}
                      canPurchase={isPlanPurchasableOnline(plan)}
                      className="w-full"
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
