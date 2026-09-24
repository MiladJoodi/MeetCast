"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

type OrderPlanButtonProps = {
  planId: string;
  isCurrent?: boolean;
  /** When false, plan cannot be purchased online (e.g. free / below minimum). */
  canPurchase?: boolean;
  className?: string;
};

export function OrderPlanButton({
  planId,
  isCurrent = false,
  canPurchase = true,
  className,
}: OrderPlanButtonProps) {
  if (isCurrent) {
    return (
      <Button type="button" variant="outline" className={className} disabled>
        Current plan
      </Button>
    );
  }

  if (!canPurchase) {
    return (
      <Button type="button" variant="outline" className={className} disabled>
        Not available
      </Button>
    );
  }

  return (
    <Button className={className} asChild>
      <Link href={`/checkout/${planId}`}>Order</Link>
    </Button>
  );
}
