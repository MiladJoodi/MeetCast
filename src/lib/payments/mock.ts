import { randomBytes } from "node:crypto";

import { MOCK_PROVIDER_ID } from "@/lib/payments/constants";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@/lib/payments/types";

/**
 * Dev / local PaymentProvider that simulates a gateway.
 * createPayment redirects to an in-app pay page; verifyPayment confirms MOCK authorities.
 */
export function createMockPaymentProvider(): PaymentProvider {
  return {
    id: MOCK_PROVIDER_ID,

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const token = randomBytes(12).toString("hex");
      const providerReference = `MOCK-${input.orderId}-${token}`;
      // Relative URL so local/dev hosts stay correct without NEXT_PUBLIC_APP_URL.
      const paymentUrl = `/billing/pay/${encodeURIComponent(input.orderId)}?authority=${encodeURIComponent(providerReference)}`;

      return {
        provider: MOCK_PROVIDER_ID,
        providerReference,
        paymentUrl,
      };
    },

    async verifyPayment(
      input: VerifyPaymentInput,
    ): Promise<VerifyPaymentResult> {
      const ref = input.providerReference.trim();
      if (!ref.startsWith("MOCK-") || ref.length < 20) {
        return {
          ok: false,
          provider: MOCK_PROVIDER_ID,
          reason: "invalid",
          message: "Invalid simulated payment reference.",
        };
      }

      if (!Number.isInteger(input.amount) || input.amount <= 0) {
        return {
          ok: false,
          provider: MOCK_PROVIDER_ID,
          reason: "amount_mismatch",
          message: "Invalid amount for simulated payment.",
        };
      }

      return {
        ok: true,
        provider: MOCK_PROVIDER_ID,
        providerReference: ref,
        amount: input.amount,
        transactionId: `sim-${ref.slice(-12)}`,
      };
    },
  };
}
