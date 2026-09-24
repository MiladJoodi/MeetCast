import type { Metadata } from "next";

import { EmptyState } from "@/components/meetcast/empty-state";
import { listOrdersForAdmin } from "@/lib/orders/queries";
import {
  formatOrderStatus,
  formatPlanPrice,
} from "@/lib/payments/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin orders",
};

function formatOrderDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function AdminOrdersPage() {
  const orders = await listOrdersForAdmin(200);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Orders</h2>
        <p className="text-sm text-muted-foreground">
          One-time plan purchases. Payment status comes from provider
          verification — there is no manual mark-as-paid.
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders"
          description="Checkout purchases will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="w-[36%] px-3 py-2.5 font-medium sm:px-4">
                  User
                </th>
                <th className="w-[24%] px-3 py-2.5 font-medium sm:px-4">
                  Plan
                </th>
                <th className="w-[20%] px-3 py-2.5 font-medium sm:px-4">
                  Payment
                </th>
                <th className="hidden w-[20%] px-3 py-2.5 font-medium sm:table-cell sm:px-4">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{order.userName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.userEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {order.planNameSnapshot}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.planSlug}
                        <span className="mx-1 text-border">·</span>
                        <span className="tabular-nums">
                          {formatPlanPrice(order.amount, order.currency)}
                        </span>
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="min-w-0">
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
                      <p className="truncate text-xs text-muted-foreground">
                        {order.provider ?? "—"}
                        {order.providerReference ? (
                          <>
                            <span className="mx-1 text-border">·</span>
                            <span className="font-mono">
                              {order.providerReference.slice(0, 10)}…
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell sm:px-4">
                    {formatOrderDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
