import { AppError } from "@/lib/errors";
import {
  MIN_PAYMENT_AMOUNT_IRR,
  PAYMENT_CURRENCY,
} from "@/lib/payments/constants";

export function assertPayableAmount(amount: number, currency: string): void {
  if (currency !== PAYMENT_CURRENCY) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Unsupported currency for checkout.",
      400,
    );
  }
  if (!Number.isInteger(amount) || amount < MIN_PAYMENT_AMOUNT_IRR) {
    throw new AppError(
      "VALIDATION_ERROR",
      "This plan cannot be purchased online.",
      400,
    );
  }
}
