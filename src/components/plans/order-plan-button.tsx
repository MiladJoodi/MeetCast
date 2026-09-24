"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { withNextParam } from "@/lib/auth/redirect";

type OrderPlanButtonProps = {
  planId: string;
  isCurrent?: boolean;
  /** When false, plan cannot be purchased online (e.g. free / below minimum). */
  canPurchase?: boolean;
  /** Logged-out visitors go to login, then checkout. */
  signedIn?: boolean;
  className?: string;
};

export function OrderPlanButton({
  planId,
  isCurrent = false,
  canPurchase = true,
  signedIn = true,
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

  const checkoutPath = `/checkout/${planId}`;
  const href = signedIn
    ? checkoutPath
    : withNextParam("/login", checkoutPath);

  return (
    <Button className={className} asChild>
      <Link href={href}>{signedIn ? "Order" : "Sign in to order"}</Link>
    </Button>
  );
}
