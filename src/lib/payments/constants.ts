/** Minimum online payment amount (ZarinPal / IRR rials). */
export const MIN_PAYMENT_AMOUNT_IRR = 1000;

export const PAYMENT_CURRENCY = "IRR" as const;

export const ZARINPAL_PROVIDER_ID = "zarinpal" as const;

/** In-app simulated gateway (local / explicit mock mode). */
export const MOCK_PROVIDER_ID = "mock" as const;

/** True when the plan can go through Order → checkout (including zero-price). */
export function isPlanPurchasableOnline(input: {
  priceAmount: number;
  currency: string;
}): boolean {
  if (input.currency !== PAYMENT_CURRENCY) return false;
  if (!Number.isInteger(input.priceAmount)) return false;
  return (
    input.priceAmount === 0 || input.priceAmount >= MIN_PAYMENT_AMOUNT_IRR
  );
}
