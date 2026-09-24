import { ZARINPAL_PROVIDER_ID } from "@/lib/payments/constants";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@/lib/payments/types";
import { logger } from "@/lib/logger";

type ZarinPalConfig = {
  merchantId: string;
  sandbox: boolean;
};

type ZarinPalRequestResponse = {
  data?: {
    code?: number;
    message?: string;
    authority?: string;
    fee_type?: string;
    fee?: number;
  };
  errors?: unknown;
};

type ZarinPalVerifyResponse = {
  data?: {
    code?: number;
    message?: string;
    card_hash?: string;
    card_pan?: string;
    ref_id?: number;
    fee_type?: string;
    fee?: number;
  };
  errors?: unknown;
};

function apiBase(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.zarinpal.com/pg/v4/payment"
    : "https://payment.zarinpal.com/pg/v4/payment";
}

function startPayBase(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://www.zarinpal.com/pg/StartPay";
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<
  | { ok: true; json: T }
  | {
      ok: false;
      reason: "network_error" | "provider_error";
      message: string;
    }
> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      reason: "network_error",
      message: "Could not reach the payment provider.",
    };
  }

  let json: T;
  try {
    json = (await response.json()) as T;
  } catch {
    return {
      ok: false,
      reason: "provider_error",
      message: "Invalid response from the payment provider.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "provider_error",
      message: "Payment provider rejected the request.",
    };
  }

  return { ok: true, json };
}

/**
 * ZarinPal PaymentProvider (v4 REST).
 * Amounts are IRR rials. Merchant ID is never returned to the client.
 */
export function createZarinPalProvider(config: ZarinPalConfig): PaymentProvider {
  const base = apiBase(config.sandbox);
  const startPay = startPayBase(config.sandbox);

  return {
    id: ZARINPAL_PROVIDER_ID,

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const result = await postJson<ZarinPalRequestResponse>(
        `${base}/request.json`,
        {
          merchant_id: config.merchantId,
          amount: input.amount,
          callback_url: input.callbackUrl,
          description: input.description.slice(0, 255),
          metadata: {
            order_id: input.orderId,
            ...(input.email ? { email: input.email } : {}),
          },
        },
      );

      if (!result.ok) {
        logger.error("payments.zarinpal_request_failed", {
          reason: result.reason,
        });
        throw new Error(result.message);
      }

      const code = result.json.data?.code;
      const authority = result.json.data?.authority?.trim();
      if (code !== 100 || !authority) {
        logger.error("payments.zarinpal_request_rejected", {
          code: typeof code === "number" ? code : "unknown",
        });
        throw new Error(
          result.json.data?.message ||
            "Payment provider did not return a payment reference.",
        );
      }

      return {
        provider: ZARINPAL_PROVIDER_ID,
        providerReference: authority,
        paymentUrl: `${startPay}/${authority}`,
      };
    },

    async verifyPayment(
      input: VerifyPaymentInput,
    ): Promise<VerifyPaymentResult> {
      const result = await postJson<ZarinPalVerifyResponse>(
        `${base}/verify.json`,
        {
          merchant_id: config.merchantId,
          amount: input.amount,
          authority: input.providerReference,
        },
      );

      if (!result.ok) {
        return {
          ok: false,
          provider: ZARINPAL_PROVIDER_ID,
          reason: result.reason,
          message: result.message,
        };
      }

      const code = result.json.data?.code;
      // 100 = first verify success; 101 = already verified (idempotent).
      if (code === 100 || code === 101) {
        return {
          ok: true,
          provider: ZARINPAL_PROVIDER_ID,
          providerReference: input.providerReference,
          amount: input.amount,
          transactionId:
            result.json.data?.ref_id != null
              ? String(result.json.data.ref_id)
              : undefined,
          alreadyVerified: code === 101,
        };
      }

      return {
        ok: false,
        provider: ZARINPAL_PROVIDER_ID,
        reason: "failed",
        message:
          result.json.data?.message ||
          "Payment was not confirmed by the provider.",
      };
    },
  };
}
