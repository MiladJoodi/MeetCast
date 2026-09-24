import type { Order } from "@/db/schema";

export type CreatePaymentInput = {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  /** Optional end-user email for provider metadata. */
  email?: string | null;
};

export type CreatePaymentResult = {
  provider: string;
  /** Gateway authority / payment reference. */
  providerReference: string;
  /** Absolute URL to redirect the user to. */
  paymentUrl: string;
};

export type VerifyPaymentInput = {
  /** Authority / reference returned by the gateway. */
  providerReference: string;
  /** Expected amount from the order (server-side). */
  amount: number;
  currency: string;
};

export type VerifyPaymentResult =
  | {
      ok: true;
      provider: string;
      providerReference: string;
      /** Verified amount in minor units. */
      amount: number;
      /** Provider-side transaction / ref id when available. */
      transactionId?: string;
      /** True when the provider reports a prior successful verify (idempotent). */
      alreadyVerified?: boolean;
    }
  | {
      ok: false;
      provider: string;
      reason:
        | "cancelled"
        | "failed"
        | "invalid"
        | "amount_mismatch"
        | "provider_error"
        | "network_error";
      message: string;
    };

export type PaymentProvider = {
  readonly id: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
};

export type CheckoutStartResult =
  | {
      ok: true;
      order: Order;
      paymentUrl: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };
