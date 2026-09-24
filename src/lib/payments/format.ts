import { PAYMENT_CURRENCY } from "@/lib/payments/constants";

/** Format IRR rial amounts for display (Persian digit grouping via en-US). */
export function formatPlanPrice(
  amount: number,
  currency: string = PAYMENT_CURRENCY,
): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0";
  }
  const formatted = new Intl.NumberFormat("en-US").format(amount);
  if (currency === "IRR") {
    return `${formatted} IRR`;
  }
  return `${formatted} ${currency}`;
}

export function formatOrderStatus(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
