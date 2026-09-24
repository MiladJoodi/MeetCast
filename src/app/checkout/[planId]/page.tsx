import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckoutConfirmForm } from "@/components/billing/checkout-confirm-form";
import { CheckoutSteps } from "@/components/billing/checkout-steps";
import { BackLink } from "@/components/meetcast/back-link";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import {
  isPlanPurchasableOnline,
} from "@/lib/payments/constants";
import { formatPlanPrice } from "@/lib/payments/format";
import {
  isMockPaymentEnabled,
  isPaymentProviderConfigured,
} from "@/lib/payments/provider";
import {
  formatPlanDurationDisplay,
} from "@/lib/plans/display";
import { getPlanById } from "@/lib/plans/queries";

type PageProps = {
  params: Promise<{ planId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { planId } = await params;
  const plan = await getPlanById(planId);
  return { title: plan ? `Checkout · ${plan.name}` : "Checkout" };
}

export default async function CheckoutPage({ params }: PageProps) {
  const user = await requireUser();
  const { planId } = await params;
  const plan = await getPlanById(planId);
  if (!plan || !plan.isActive) {
    notFound();
  }

  if (plan.id === user.planId) {
    redirect("/plans");
  }

  const payable = isPlanPurchasableOnline(plan);
  const isZeroPrice = plan.priceAmount === 0;
  const providerReady = isZeroPrice || isPaymentProviderConfigured();
  const simulated = !isZeroPrice && isMockPaymentEnabled();
  const priceLabel = formatPlanPrice(plan.priceAmount, plan.currency);

  return (
    <div className="flex flex-1 flex-col gap-8 p-5 sm:p-7">
      <div className="space-y-1.5">
        <BackLink href="/plans" label="Plans" />
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
          Checkout
        </h1>
        <p className="text-sm text-muted-foreground">
          One-time purchase — review, pay, then your plan updates.
        </p>
      </div>

      <CheckoutSteps current="review" />

      <div className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-border/80 bg-surface-elevated p-5">
        {!payable ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium">{plan.name}</p>
            <p className="text-muted-foreground">
              This plan cannot be purchased online.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/plans">Back to plans</Link>
            </Button>
          </div>
        ) : !providerReady ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium">{plan.name}</p>
            <p className="text-muted-foreground">
              Payment is temporarily unavailable. Please try again later.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/plans">Back to plans</Link>
            </Button>
          </div>
        ) : (
          <CheckoutConfirmForm
            planId={plan.id}
            planName={plan.name}
            priceLabel={priceLabel}
            participantsLabel={`${plan.maxConcurrentParticipants} people`}
            durationLabel={formatPlanDurationDisplay(plan)}
            simulated={simulated}
            zeroPrice={isZeroPrice}
          />
        )}
      </div>
    </div>
  );
}
