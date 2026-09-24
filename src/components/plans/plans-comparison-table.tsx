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
  signedIn?: boolean;
  tone?: "default" | "marketing";
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

function PlanCellValue({
  value,
  marketing = false,
}: {
  value: string;
  marketing?: boolean;
}) {
  if (value === "✓") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          marketing ? "text-[var(--live)]" : "text-success",
        )}
        title="Included"
      >
        <Check className="size-4" strokeWidth={2.5} aria-label="Included" />
      </span>
    );
  }
  if (value === "Unlimited") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1.5",
          marketing ? "text-white" : "text-foreground",
        )}
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
  signedIn = true,
  tone = "default",
}: PlansComparisonTableProps) {
  if (plans.length === 0) return null;

  const rows = buildPlanComparisonRows(plans);
  const groups = groupRows(rows);
  const marketing = tone === "marketing";

  return (
    <section className="space-y-3">
      <h2
        className={cn(
          "text-sm font-medium",
          marketing ? "text-white/50" : "text-muted-foreground",
        )}
      >
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
                "overflow-hidden rounded-xl border",
                marketing
                  ? "border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)]"
                  : "border-border/80 bg-surface-elevated",
                isCurrent &&
                  (marketing
                    ? "border-[color-mix(in_oklch,var(--live)_55%,white)]/40"
                    : "border-brand/30 bg-brand-soft/25"),
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between gap-2 border-b px-4 py-3",
                  marketing ? "border-white/10" : "border-border/70",
                )}
              >
                <h3
                  className={cn(
                    "font-semibold tracking-tight",
                    marketing && "text-white",
                  )}
                >
                  {plan.name}
                </h3>
                {isCurrent ? (
                  <span
                    className={cn(
                      "text-xs",
                      marketing ? "text-[var(--live)]" : "text-brand",
                    )}
                  >
                    Current
                  </span>
                ) : null}
              </div>
              {groups.map((group) => (
                <div
                  key={group.name}
                  className={cn(
                    "border-b last:border-0",
                    marketing ? "border-white/10" : "border-border/70",
                  )}
                >
                  <p
                    className={cn(
                      "px-4 py-2 text-xs font-medium",
                      marketing
                        ? "bg-white/5 text-white/45"
                        : "bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {group.name}
                  </p>
                  <dl className="px-4">
                    {group.rows.map((row) => (
                      <div
                        key={row.feature}
                        className={cn(
                          "flex justify-between gap-4 border-b py-2.5 last:border-0",
                          marketing ? "border-white/8" : "border-border/50",
                        )}
                      >
                        <dt
                          className={cn(
                            "text-sm",
                            marketing
                              ? "text-white/55"
                              : "text-muted-foreground",
                          )}
                        >
                          {row.feature}
                        </dt>
                        <dd
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            marketing && "text-white",
                          )}
                        >
                          <PlanCellValue
                            value={row.values[planIndex] ?? ""}
                            marketing={marketing}
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <div
                className={cn(
                  "space-y-2 border-t px-4 py-3",
                  marketing ? "border-white/10" : "border-border/70",
                )}
              >
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    marketing && "text-white",
                  )}
                >
                  {formatPlanPrice(plan.priceAmount, plan.currency)}
                </p>
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
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop — horizontal scroll only; do not force overflow-y:auto */}
      <div
        className={cn(
          "hidden overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl border md:block",
          marketing ? "border-white/12" : "border-border/80",
        )}
      >
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr
              className={cn(
                "border-b",
                marketing
                  ? "border-white/10 bg-white/5"
                  : "border-border bg-muted/30",
              )}
            >
              <th
                scope="col"
                className={cn(
                  "sticky left-0 z-10 px-4 py-3 text-sm font-medium",
                  marketing
                    ? "bg-[color-mix(in_oklch,var(--room-chrome)_92%,black)] text-white/45"
                    : "bg-muted/30 text-muted-foreground",
                )}
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
                      marketing && "text-white",
                      isCurrent &&
                        (marketing
                          ? "bg-white/8 text-[var(--live)]"
                          : "bg-brand-soft/40 text-brand"),
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
                    className={cn(
                      "px-4 py-2 text-left text-xs font-medium",
                      marketing
                        ? "bg-white/5 text-white/45"
                        : "bg-muted/25 text-muted-foreground",
                    )}
                  >
                    {group.name}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b last:border-0",
                      marketing ? "border-white/8" : "border-border/60",
                    )}
                  >
                    <th
                      scope="row"
                      className={cn(
                        "sticky left-0 z-10 px-4 py-3 font-medium",
                        marketing
                          ? "bg-[color-mix(in_oklch,var(--room-chrome)_92%,black)] text-white/55"
                          : "bg-background text-muted-foreground",
                      )}
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
                            marketing && "text-white/90",
                            isCurrent &&
                              (marketing
                                ? "bg-white/5"
                                : "bg-brand-soft/20"),
                          )}
                        >
                          <PlanCellValue
                            value={value}
                            marketing={marketing}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr
              className={cn(
                "border-t",
                marketing ? "border-white/10 bg-white/5" : "border-border bg-muted/15",
              )}
            >
              <th
                scope="row"
                className={cn(
                  "sticky left-0 z-10 px-4 py-4 text-sm font-medium",
                  marketing
                    ? "bg-[color-mix(in_oklch,var(--room-chrome)_92%,black)] text-white/45"
                    : "bg-muted/15 text-muted-foreground",
                )}
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
                      isCurrent &&
                        (marketing ? "bg-white/5" : "bg-brand-soft/20"),
                    )}
                  >
                    <p
                      className={cn(
                        "text-center text-sm font-semibold tabular-nums",
                        marketing && "text-white",
                      )}
                    >
                      {formatPlanPrice(plan.priceAmount, plan.currency)}
                    </p>
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
