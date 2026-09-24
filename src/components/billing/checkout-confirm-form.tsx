"use client";

import { useActionState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import {
  confirmCheckoutAction,
  type CheckoutActionState,
} from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: CheckoutActionState = { ok: false };

type CheckoutConfirmFormProps = {
  planId: string;
  planName: string;
  priceLabel: string;
  participantsLabel: string;
  durationLabel: string;
  /** When true, CTA copy reflects the in-app simulated gateway. */
  simulated?: boolean;
  /** Zero-amount plan — order still runs, no gateway. */
  zeroPrice?: boolean;
};

export function CheckoutConfirmForm({
  planId,
  planName,
  priceLabel,
  participantsLabel,
  durationLabel,
  simulated = false,
  zeroPrice = false,
}: CheckoutConfirmFormProps) {
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const [state, formAction, pending] = useActionState(
    confirmCheckoutAction,
    initialState,
  );

  useEffect(() => {
    if (state.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <dl className="space-y-0 text-sm">
        <div className="flex justify-between gap-4 border-b border-border/70 py-3">
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="font-medium">{planName}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/70 py-3">
          <dt className="text-muted-foreground">Participants</dt>
          <dd className="tabular-nums">{participantsLabel}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/70 py-3">
          <dt className="text-muted-foreground">Duration</dt>
          <dd>{durationLabel}</dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="text-base font-semibold tabular-nums">{priceLabel}</dd>
        </div>
      </dl>

      {state.fieldErrors?.planId ? (
        <p className="text-xs text-destructive">{state.fieldErrors.planId[0]}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? zeroPrice
            ? "Confirming…"
            : "Opening payment…"
          : zeroPrice
            ? "Confirm order"
            : simulated
              ? "Continue to payment"
              : "Confirm and pay"}
      </Button>
      <p
        className={cn(
          "text-center text-xs text-muted-foreground",
          simulated && !zeroPrice && "text-warning",
        )}
      >
        {zeroPrice
          ? "No charge for this plan. Confirm to place the order and activate it."
          : simulated
            ? "Development mode: you’ll confirm payment on the next screen. Your plan updates only after verification."
            : "You’ll be redirected to the payment gateway. Your plan updates only after payment is verified."}
      </p>
    </form>
  );
}
