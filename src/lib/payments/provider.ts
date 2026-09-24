import "server-only";

import { AppError } from "@/lib/errors";
import {
  MOCK_PROVIDER_ID,
  ZARINPAL_PROVIDER_ID,
} from "@/lib/payments/constants";
import { createMockPaymentProvider } from "@/lib/payments/mock";
import type { PaymentProvider } from "@/lib/payments/types";
import { createZarinPalProvider } from "@/lib/payments/zarinpal";

export { assertPayableAmount } from "@/lib/payments/amount";

function readMerchantId(): string | undefined {
  const value = process.env.ZARINPAL_MERCHANT_ID?.trim();
  return value || undefined;
}

function isSandbox(): boolean {
  const raw = process.env.ZARINPAL_SANDBOX?.trim().toLowerCase();
  if (!raw) {
    return process.env.NODE_ENV !== "production";
  }
  return raw === "1" || raw === "true" || raw === "yes";
}

function requestedProvider(): "zarinpal" | "mock" | "auto" {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (raw === "zarinpal" || raw === "mock") return raw;
  return "auto";
}

/**
 * In-app mock gateway is used when:
 * - PAYMENT_PROVIDER=mock, or
 * - auto mode + no ZarinPal merchant + not production.
 */
export function isMockPaymentEnabled(): boolean {
  const mode = requestedProvider();
  if (mode === "mock") return true;
  if (mode === "zarinpal") return false;
  return !readMerchantId() && process.env.NODE_ENV !== "production";
}

/** True when checkout can start (ZarinPal merchant or allowed mock). */
export function isPaymentProviderConfigured(): boolean {
  if (readMerchantId()) return true;
  return isMockPaymentEnabled();
}

export function getActivePaymentProviderId(): string {
  if (isMockPaymentEnabled()) return MOCK_PROVIDER_ID;
  return ZARINPAL_PROVIDER_ID;
}

/**
 * Resolve the configured PaymentProvider.
 * Secrets stay server-only — never call from client components.
 */
export function getPaymentProvider(): PaymentProvider {
  if (isMockPaymentEnabled()) {
    return createMockPaymentProvider();
  }

  const merchantId = readMerchantId();
  if (!merchantId) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Payment provider is not configured.",
      503,
    );
  }

  if (merchantId.length < 8) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Payment provider configuration is invalid.",
      503,
    );
  }

  return createZarinPalProvider({
    merchantId,
    sandbox: isSandbox(),
  });
}

export { ZARINPAL_PROVIDER_ID, MOCK_PROVIDER_ID };
