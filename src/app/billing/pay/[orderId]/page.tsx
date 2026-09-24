import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckoutSteps } from "@/components/billing/checkout-steps";
import { SimulatedPayActions } from "@/components/billing/simulated-pay-actions";
import { BackLink } from "@/components/meetcast/back-link";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getOrderForUser } from "@/lib/orders/queries";
import { MOCK_PROVIDER_ID } from "@/lib/payments/constants";
import { formatPlanPrice } from "@/lib/payments/format";

export const metadata: Metadata = {
  title: "Payment",
};

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ authority?: string }>;
};

export default async function SimulatedPayPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireUser();
  const { orderId } = await params;
  const { authority: authorityParam } = await searchParams;

  const order = await getOrderForUser(orderId, user.id);
  if (!order) {
    notFound();
  }

  if (order.status === "paid") {
    redirect(`/billing/result?status=success&orderId=${order.id}`);
  }

  if (order.status !== "pending") {
    redirect(`/billing/result?status=failed&orderId=${order.id}`);
  }

  const authority =
    authorityParam?.trim() || order.providerReference?.trim() || "";

  if (!authority || (order.providerReference && order.providerReference !== authority)) {
    redirect(`/billing/result?status=error&orderId=${order.id}`);
  }

  if (order.provider && order.provider !== MOCK_PROVIDER_ID) {
    // Real gateway orders should not use this page.
    if (order.paymentUrl) {
      redirect(order.paymentUrl);
    }
    notFound();
  }

  const priceLabel = formatPlanPrice(order.amount, order.currency);

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <div className="space-y-1.5">
        <BackLink href="/plans" label="Plans" />
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
          Payment
        </h1>
        <p className="text-sm text-muted-foreground">
          Simulated gateway — confirm to complete the purchase.
        </p>
      </div>

      <CheckoutSteps current="pay" />

      <div className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-border/80 bg-surface-elevated p-5">
        <div className="space-y-1 border-b border-border/70 pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            MeetCast payment
          </p>
          <p className="text-lg font-semibold tracking-tight">
            {order.planNameSnapshot}
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {priceLabel}
          </p>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="truncate font-mono text-xs text-muted-foreground">
              {order.id.slice(0, 8)}…
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="max-w-[12rem] truncate font-mono text-xs text-muted-foreground">
              {authority}
            </dd>
          </div>
        </dl>

        <SimulatedPayActions orderId={order.id} authority={authority} />

        <Button variant="ghost" className="w-full" asChild>
          <Link href="/billing">View billing history</Link>
        </Button>
      </div>
    </div>
  );
}
