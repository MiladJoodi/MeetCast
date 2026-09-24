"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

type SimulatedPayActionsProps = {
  orderId: string;
  authority: string;
};

/**
 * Completes the simulated gateway by hitting the same callback route
 * the real provider would redirect to (Status + Authority).
 */
export function SimulatedPayActions({
  orderId,
  authority,
}: SimulatedPayActionsProps) {
  const successHref = `/api/payment/callback?orderId=${encodeURIComponent(orderId)}&Authority=${encodeURIComponent(authority)}&Status=OK`;
  const cancelHref = `/api/payment/callback?orderId=${encodeURIComponent(orderId)}&Authority=${encodeURIComponent(authority)}&Status=NOK`;

  return (
    <div className="space-y-2">
      <Button className="w-full" asChild>
        <Link href={successHref}>Pay successfully</Link>
      </Button>
      <Button variant="outline" className="w-full" asChild>
        <Link href={cancelHref}>Cancel payment</Link>
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        This screen stands in for the bank gateway in development. Choosing
        success runs the real verification + plan activation path.
      </p>
    </div>
  );
}
