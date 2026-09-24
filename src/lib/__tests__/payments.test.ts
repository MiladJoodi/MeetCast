import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors";
import { assertPayableAmount } from "@/lib/payments/amount";
import { formatOrderStatus, formatPlanPrice } from "@/lib/payments/format";
import { MIN_PAYMENT_AMOUNT_IRR } from "@/lib/payments/constants";
import type {
  CreatePaymentInput,
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@/lib/payments/types";
import { createZarinPalProvider } from "@/lib/payments/zarinpal";

function mockFetchJson(payload: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
}

describe("formatPlanPrice", () => {
  it("formats free and paid amounts", () => {
    expect(formatPlanPrice(0)).toBe("0");
    expect(formatPlanPrice(490000, "IRR")).toBe("490,000 IRR");
  });
});

describe("formatOrderStatus", () => {
  it("maps known statuses", () => {
    expect(formatOrderStatus("paid")).toBe("Paid");
    expect(formatOrderStatus("cancelled")).toBe("Cancelled");
  });
});

describe("assertPayableAmount", () => {
  it("accepts IRR amounts at or above the gateway minimum", () => {
    expect(() =>
      assertPayableAmount(MIN_PAYMENT_AMOUNT_IRR, "IRR"),
    ).not.toThrow();
    expect(() => assertPayableAmount(990000, "IRR")).not.toThrow();
  });

  it("rejects free / below-minimum / wrong currency", () => {
    expect(() => assertPayableAmount(0, "IRR")).toThrow(AppError);
    expect(() => assertPayableAmount(999, "IRR")).toThrow(AppError);
    expect(() => assertPayableAmount(1000, "USD")).toThrow(AppError);
  });
});

describe("createZarinPalProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates a payment with the server amount and returns a start URL", async () => {
    const fetchMock = mockFetchJson({
      data: {
        code: 100,
        authority: "A".repeat(36),
        message: "Success",
      },
      errors: [],
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createZarinPalProvider({
      merchantId: "test-merchant-id",
      sandbox: true,
    });

    const input: CreatePaymentInput = {
      orderId: "11111111-1111-4111-8111-111111111111",
      amount: 490000,
      currency: "IRR",
      description: "MeetCast plan: Starter",
      callbackUrl:
        "http://localhost:3000/api/payment/callback?orderId=11111111-1111-4111-8111-111111111111",
    };

    const result = await provider.createPayment(input);

    expect(result.provider).toBe("zarinpal");
    expect(result.providerReference).toBe("A".repeat(36));
    expect(result.paymentUrl).toContain("/pg/StartPay/");
    expect(result.paymentUrl).toContain(result.providerReference);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      amount: number;
      merchant_id: string;
      callback_url: string;
    };
    expect(body.amount).toBe(490000);
    expect(body.merchant_id).toBe("test-merchant-id");
    expect(body.callback_url).toBe(input.callbackUrl);
  });

  it("throws when the provider rejects payment creation", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({
        data: { code: -9, message: "Validation error" },
        errors: [],
      }),
    );

    const provider = createZarinPalProvider({
      merchantId: "test-merchant-id",
      sandbox: true,
    });

    await expect(
      provider.createPayment({
        orderId: "11111111-1111-4111-8111-111111111111",
        amount: 490000,
        currency: "IRR",
        description: "MeetCast plan: Starter",
        callbackUrl: "http://localhost:3000/api/payment/callback",
      }),
    ).rejects.toThrow();
  });

  it("verifies a successful payment", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({
        data: { code: 100, ref_id: 12345, message: "Verified" },
        errors: [],
      }),
    );

    const provider = createZarinPalProvider({
      merchantId: "test-merchant-id",
      sandbox: true,
    });

    const verified = await provider.verifyPayment({
      providerReference: "A".repeat(36),
      amount: 490000,
      currency: "IRR",
    });

    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.amount).toBe(490000);
      expect(verified.transactionId).toBe("12345");
      expect(verified.alreadyVerified).toBe(false);
    }
  });

  it("treats verify code 101 as already verified (idempotent)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({
        data: { code: 101, ref_id: 12345, message: "Already verified" },
        errors: [],
      }),
    );

    const provider = createZarinPalProvider({
      merchantId: "test-merchant-id",
      sandbox: true,
    });

    const verified = await provider.verifyPayment({
      providerReference: "A".repeat(36),
      amount: 490000,
      currency: "IRR",
    });

    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.alreadyVerified).toBe(true);
    }
  });

  it("returns failed verification for non-success codes", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson({
        data: { code: -51, message: "Failed" },
        errors: [],
      }),
    );

    const provider = createZarinPalProvider({
      merchantId: "test-merchant-id",
      sandbox: true,
    });

    const verified = await provider.verifyPayment({
      providerReference: "A".repeat(36),
      amount: 490000,
      currency: "IRR",
    });

    expect(verified.ok).toBe(false);
    if (!verified.ok) {
      expect(verified.reason).toBe("failed");
    }
  });

  it("returns network_error when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    const provider = createZarinPalProvider({
      merchantId: "test-merchant-id",
      sandbox: true,
    });

    const verified = await provider.verifyPayment({
      providerReference: "A".repeat(36),
      amount: 490000,
      currency: "IRR",
    });

    expect(verified.ok).toBe(false);
    if (!verified.ok) {
      expect(verified.reason).toBe("network_error");
    }
  });
});

/**
 * In-memory stand-in for order fulfillment / callback idempotency rules.
 * Mirrors fulfillPaidOrder + callback verification gates without a DB.
 */
function simulateCheckoutFlow(options: {
  order: {
    id: string;
    userId: string;
    planId: string;
    amount: number;
    status: "pending" | "paid" | "failed" | "cancelled";
    providerReference: string | null;
  };
  userPlanId: string;
  provider: PaymentProvider;
  gatewayStatus: string;
  authority: string;
  planActive: boolean;
}) {
  const events: string[] = [];
  let order = { ...options.order };
  let userPlanId = options.userPlanId;

  if (order.status === "paid") {
    return { order, userPlanId, events: ["already_paid"] };
  }

  if (options.gatewayStatus.toUpperCase() !== "OK") {
    if (order.status === "pending") {
      order = { ...order, status: "cancelled" };
      events.push("cancelled");
    }
    return { order, userPlanId, events };
  }

  if (!options.planActive && order.status === "pending") {
    events.push("inactive_plan");
    return { order, userPlanId, events };
  }

  if (
    order.providerReference &&
    order.providerReference !== options.authority
  ) {
    events.push("reference_mismatch");
    return { order, userPlanId, events };
  }

  return options.provider
    .verifyPayment({
      providerReference: options.authority,
      amount: order.amount,
      currency: "IRR",
    } satisfies VerifyPaymentInput)
    .then((verified: VerifyPaymentResult) => {
      if (!verified.ok) {
        order = {
          ...order,
          status: verified.reason === "cancelled" ? "cancelled" : "failed",
        };
        events.push(`verify_${verified.reason}`);
        return { order, userPlanId, events };
      }

      if (verified.amount !== order.amount) {
        order = { ...order, status: "failed" };
        events.push("amount_mismatch");
        return { order, userPlanId, events };
      }

      if (order.status === "pending") {
        order = { ...order, status: "paid" };
        userPlanId = order.planId;
        events.push("fulfilled");
      } else if (order.status === "paid") {
        events.push("already_paid");
      }

      // Duplicate callback after paid
      if (order.status === "paid") {
        events.push("idempotent_paid");
      }

      return { order, userPlanId, events };
    });
}

describe("createMockPaymentProvider", () => {
  it("creates a relative pay URL and verifies MOCK authorities", async () => {
    const { createMockPaymentProvider } = await import("@/lib/payments/mock");
    const provider = createMockPaymentProvider();

    const created = await provider.createPayment({
      orderId: "11111111-1111-4111-8111-111111111111",
      amount: 490000,
      currency: "IRR",
      description: "MeetCast plan: Starter",
      callbackUrl: "http://localhost:3000/api/payment/callback",
    });

    expect(created.provider).toBe("mock");
    expect(created.providerReference.startsWith("MOCK-")).toBe(true);
    expect(created.paymentUrl).toContain("/billing/pay/");
    expect(created.paymentUrl).toContain("authority=");

    const verified = await provider.verifyPayment({
      providerReference: created.providerReference,
      amount: 490000,
      currency: "IRR",
    });
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.amount).toBe(490000);
    }
  });

  it("rejects invalid mock references", async () => {
    const { createMockPaymentProvider } = await import("@/lib/payments/mock");
    const provider = createMockPaymentProvider();
    const verified = await provider.verifyPayment({
      providerReference: "BAD",
      amount: 490000,
      currency: "IRR",
    });
    expect(verified.ok).toBe(false);
  });
});

describe("payment verification flow (mocked provider)", () => {
  const baseOrder = {
    id: "order-1",
    userId: "user-1",
    planId: "plan-pro",
    amount: 990000,
    status: "pending" as const,
    providerReference: "AUTH-1",
  };

  function mockProvider(
    verify: (input: VerifyPaymentInput) => Promise<VerifyPaymentResult>,
  ): PaymentProvider {
    return {
      id: "mock",
      createPayment: async () => ({
        provider: "mock",
        providerReference: "AUTH-1",
        paymentUrl: "https://example.test/pay",
      }),
      verifyPayment: verify,
    };
  }

  it("fulfills on successful verification with matching amount", async () => {
    const provider = mockProvider(async (input) => ({
      ok: true,
      provider: "mock",
      providerReference: input.providerReference,
      amount: input.amount,
    }));

    const result = await simulateCheckoutFlow({
      order: baseOrder,
      userPlanId: "plan-free",
      provider,
      gatewayStatus: "OK",
      authority: "AUTH-1",
      planActive: true,
    });

    expect(result.order.status).toBe("paid");
    expect(result.userPlanId).toBe("plan-pro");
    expect(result.events).toContain("fulfilled");
  });

  it("rejects amount mismatch and does not assign the plan", async () => {
    const provider = mockProvider(async (input) => ({
      ok: true,
      provider: "mock",
      providerReference: input.providerReference,
      amount: input.amount - 1,
    }));

    const result = await simulateCheckoutFlow({
      order: baseOrder,
      userPlanId: "plan-free",
      provider,
      gatewayStatus: "OK",
      authority: "AUTH-1",
      planActive: true,
    });

    expect(result.order.status).toBe("failed");
    expect(result.userPlanId).toBe("plan-free");
    expect(result.events).toContain("amount_mismatch");
  });

  it("handles failed verification", async () => {
    const provider = mockProvider(async () => ({
      ok: false,
      provider: "mock",
      reason: "failed",
      message: "nope",
    }));

    const result = await simulateCheckoutFlow({
      order: baseOrder,
      userPlanId: "plan-free",
      provider,
      gatewayStatus: "OK",
      authority: "AUTH-1",
      planActive: true,
    });

    expect(result.order.status).toBe("failed");
    expect(result.userPlanId).toBe("plan-free");
  });

  it("handles cancelled gateway status", async () => {
    const provider = mockProvider(async () => ({
      ok: true,
      provider: "mock",
      providerReference: "AUTH-1",
      amount: 990000,
    }));

    const result = await simulateCheckoutFlow({
      order: baseOrder,
      userPlanId: "plan-free",
      provider,
      gatewayStatus: "NOK",
      authority: "AUTH-1",
      planActive: true,
    });

    expect(result.order.status).toBe("cancelled");
    expect(result.userPlanId).toBe("plan-free");
    expect(result.events).toContain("cancelled");
  });

  it("is idempotent for already-paid orders", async () => {
    const provider = mockProvider(async (input) => ({
      ok: true,
      provider: "mock",
      providerReference: input.providerReference,
      amount: input.amount,
    }));

    const result = await simulateCheckoutFlow({
      order: { ...baseOrder, status: "paid" },
      userPlanId: "plan-pro",
      provider,
      gatewayStatus: "OK",
      authority: "AUTH-1",
      planActive: true,
    });

    expect(result.events).toEqual(["already_paid"]);
    expect(result.userPlanId).toBe("plan-pro");
  });

  it("rejects authority / reference mismatch", async () => {
    const provider = mockProvider(async (input) => ({
      ok: true,
      provider: "mock",
      providerReference: input.providerReference,
      amount: input.amount,
    }));

    const result = await simulateCheckoutFlow({
      order: baseOrder,
      userPlanId: "plan-free",
      provider,
      gatewayStatus: "OK",
      authority: "OTHER",
      planActive: true,
    });

    expect(result.events).toContain("reference_mismatch");
    expect(result.order.status).toBe("pending");
    expect(result.userPlanId).toBe("plan-free");
  });

  it("blocks fulfillment when the purchased plan is inactive", async () => {
    const provider = mockProvider(async (input) => ({
      ok: true,
      provider: "mock",
      providerReference: input.providerReference,
      amount: input.amount,
    }));

    const result = await simulateCheckoutFlow({
      order: baseOrder,
      userPlanId: "plan-free",
      provider,
      gatewayStatus: "OK",
      authority: "AUTH-1",
      planActive: false,
    });

    expect(result.events).toContain("inactive_plan");
    expect(result.order.status).toBe("pending");
    expect(result.userPlanId).toBe("plan-free");
  });

  it("duplicate successful callback does not change plan twice", async () => {
    const provider = mockProvider(async (input) => ({
      ok: true,
      provider: "mock",
      providerReference: input.providerReference,
      amount: input.amount,
    }));

    const first = await simulateCheckoutFlow({
      order: baseOrder,
      userPlanId: "plan-free",
      provider,
      gatewayStatus: "OK",
      authority: "AUTH-1",
      planActive: true,
    });

    const second = await simulateCheckoutFlow({
      order: first.order as typeof baseOrder,
      userPlanId: first.userPlanId,
      provider,
      gatewayStatus: "OK",
      authority: "AUTH-1",
      planActive: true,
    });

    expect(first.userPlanId).toBe("plan-pro");
    expect(second.events).toEqual(["already_paid"]);
    expect(second.userPlanId).toBe("plan-pro");
  });
});
