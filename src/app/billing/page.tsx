import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/meetcast/empty-state";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listOrdersForUser } from "@/lib/orders/queries";
import {
  formatOrderStatus,
  formatPlanPrice,
} from "@/lib/payments/format";
import {
  formatPlanDurationDisplay,
} from "@/lib/plans/display";
import { getUserPlan } from "@/lib/plans/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Billing",
};

function formatOrderDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function BillingPage() {
  const user = await requireUser();
  const [orders, currentPlan] = await Promise.all([
    listOrdersForUser(user.id),
    getUserPlan(user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <header className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
            Billing
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/plans">Change plan</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Plan and purchase history.
        </p>
      </header>

      <section aria-labelledby="current-plan-heading" className="space-y-3">
        <h2
          id="current-plan-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Current plan
        </h2>
        <div className="rounded-xl border border-border/80 bg-surface-elevated px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-lg font-semibold tracking-tight">
              {currentPlan.name}
            </p>
            <p className="text-sm tabular-nums text-muted-foreground">
              {formatPlanPrice(currentPlan.priceAmount, currentPlan.currency)}
            </p>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Participants</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {currentPlan.maxConcurrentParticipants}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Meeting length</dt>
              <dd className="mt-0.5 font-medium">
                {formatPlanDurationDisplay(currentPlan)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="history-heading" className="space-y-3">
        <h2
          id="history-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Purchases
        </h2>

        {orders.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="When you buy a plan, it shows up here."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/plans">Browse plans</Link>
              </Button>
            }
          />
        ) : (
          <>
            <ul className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated md:hidden">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="border-b border-border/70 px-3.5 py-3 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold tracking-tight">
                        {order.planNameSnapshot}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm tabular-nums">
                        {formatPlanPrice(order.amount, order.currency)}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-medium",
                          order.status === "paid" && "text-success",
                          order.status === "pending" && "text-warning",
                          (order.status === "failed" ||
                            order.status === "cancelled") &&
                            "text-muted-foreground",
                        )}
                      >
                        {formatOrderStatus(order.status)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-hidden rounded-xl border border-border/80 md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    <th className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-3 py-3.5 font-semibold">
                        {order.planNameSnapshot}
                      </td>
                      <td className="px-3 py-3.5 tabular-nums text-muted-foreground">
                        {formatPlanPrice(order.amount, order.currency)}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            order.status === "paid" && "text-success",
                            order.status === "pending" && "text-warning",
                            (order.status === "failed" ||
                              order.status === "cancelled") &&
                              "text-muted-foreground",
                          )}
                        >
                          {formatOrderStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">
                        {formatOrderDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
