import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutSteps } from "@/components/billing/checkout-steps";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getOrderForUser } from "@/lib/orders/queries";
import { formatOrderStatus } from "@/lib/payments/format";
import { getUserPlan } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Payment result",
};

type PageProps = {
  searchParams: Promise<{ status?: string; orderId?: string }>;
};

export default async function BillingResultPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const status = (params.status ?? "error").toLowerCase();
  const orderId = params.orderId;

  const [order, currentPlan] = await Promise.all([
    orderId ? getOrderForUser(orderId, user.id) : Promise.resolve(null),
    getUserPlan(user.id),
  ]);

  const success = status === "success" || order?.status === "paid";
  const cancelled =
    status === "cancelled" || order?.status === "cancelled";
  const failed = status === "failed" || order?.status === "failed";

  let title = "Payment issue";
  let description =
    "We could not confirm this payment. Your plan was not changed.";

  if (success) {
    title = "Payment successful";
    description = `Order status: Paid. Your plan is now ${currentPlan.name}.`;
  } else if (cancelled) {
    title = "Payment cancelled";
    description =
      "You cancelled the payment. Your plan was not changed. The order remains in your history.";
  } else if (failed) {
    title = "Payment failed";
    description =
      "The payment was not completed. Your plan was not changed.";
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <CheckoutSteps current="done" />

      <header className="mx-auto w-full max-w-md space-y-4 text-center">
        <div className="space-y-2 rounded-xl border border-border/80 bg-surface-elevated px-5 py-6">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          {order ? (
            <p className="text-xs text-muted-foreground">
              {order.planNameSnapshot} · {formatOrderStatus(order.status)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/billing">Billing history</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={success ? "/dashboard" : "/plans"}>
              {success ? "Dashboard" : "Plans"}
            </Link>
          </Button>
        </div>
      </header>
    </div>
  );
}
