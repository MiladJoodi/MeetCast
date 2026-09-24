import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { orders, type Order, type Plan, type User } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { PAYMENT_CURRENCY } from "@/lib/payments/constants";
import { assertPayableAmount } from "@/lib/payments/amount";
import { fulfillPaidOrder } from "@/lib/payments/fulfill";
import {
  getPaymentProvider,
} from "@/lib/payments/provider";
import type { CheckoutStartResult } from "@/lib/payments/types";
import { getAppOrigin } from "@/lib/payments/app-origin";

/**
 * Create (or reuse) a pending order and start a gateway payment.
 * Amount always comes from the plan row — never from the client.
 * Zero-price plans still create an order, then fulfill without a gateway.
 */
export async function startCheckoutPayment(input: {
  user: Pick<User, "id" | "email">;
  plan: Plan;
  idempotencyKey: string;
}): Promise<CheckoutStartResult> {
  const { user, plan, idempotencyKey } = input;

  if (!plan.isActive) {
    return {
      ok: false,
      code: "INACTIVE_PLAN",
      message: "This plan is not available for purchase.",
    };
  }

  const isZeroPrice =
    plan.priceAmount === 0 &&
    (plan.currency || PAYMENT_CURRENCY) === PAYMENT_CURRENCY;

  if (!isZeroPrice) {
    try {
      assertPayableAmount(plan.priceAmount, plan.currency || PAYMENT_CURRENCY);
    } catch (error) {
      if (error instanceof AppError) {
        return { ok: false, code: error.code, message: error.message };
      }
      throw error;
    }
  } else if ((plan.currency || PAYMENT_CURRENCY) !== PAYMENT_CURRENCY) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Unsupported currency for checkout.",
    };
  }

  const existingByKey = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, idempotencyKey))
    .limit(1);

  let order: Order | undefined = existingByKey[0];

  if (order) {
    if (order.userId !== user.id) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Order does not belong to this account.",
      };
    }
    if (order.status === "paid") {
      return {
        ok: false,
        code: "ALREADY_PAID",
        message: "This order was already paid.",
      };
    }
    if (order.status !== "pending") {
      return {
        ok: false,
        code: "ORDER_CLOSED",
        message: "This checkout attempt is no longer available.",
      };
    }
    if (
      order.planId !== plan.id ||
      order.amount !== plan.priceAmount ||
      order.currency !== (plan.currency || PAYMENT_CURRENCY)
    ) {
      return {
        ok: false,
        code: "CONFLICT",
        message: "Checkout details changed. Start again from Plans.",
      };
    }
    if (order.paymentUrl && order.providerReference) {
      return { ok: true, order, paymentUrl: order.paymentUrl };
    }
  } else {
    try {
      const inserted = await db
        .insert(orders)
        .values({
          userId: user.id,
          planId: plan.id,
          planNameSnapshot: plan.name,
          amount: plan.priceAmount,
          currency: plan.currency || PAYMENT_CURRENCY,
          status: "pending",
          idempotencyKey,
        })
        .returning();
      order = inserted[0];
    } catch (error) {
      // Unique idempotency race — re-read.
      if (isUniqueViolation(error)) {
        const raced = await db
          .select()
          .from(orders)
          .where(eq(orders.idempotencyKey, idempotencyKey))
          .limit(1);
        order = raced[0];
      } else {
        throw error;
      }
    }
  }

  if (!order) {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Could not create the order.",
    };
  }

  if (order.userId !== user.id) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Order does not belong to this account.",
    };
  }

  if (order.amount === 0) {
    if (order.status === "pending") {
      await fulfillPaidOrder(order.id);
    }
    return {
      ok: true,
      order,
      paymentUrl: `/billing/result?status=success&orderId=${encodeURIComponent(order.id)}`,
    };
  }

  let provider;
  try {
    provider = getPaymentProvider();
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, code: error.code, message: error.message };
    }
    throw error;
  }

  const origin = getAppOrigin();
  const callbackUrl = `${origin}/api/payment/callback?orderId=${encodeURIComponent(order.id)}`;

  let payment;
  try {
    payment = await provider.createPayment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      description: `MeetCast plan: ${order.planNameSnapshot}`,
      callbackUrl,
      email: user.email,
    });
  } catch (error) {
    logger.error("payments.create_failed", {
      orderId: order.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    await db
      .update(orders)
      .set({ status: "failed" })
      .where(eq(orders.id, order.id));
    return {
      ok: false,
      code: "PROVIDER_ERROR",
      message: "Could not start payment. Please try again.",
    };
  }

  if (
    !payment.paymentUrl ||
    !payment.providerReference ||
    payment.provider !== provider.id
  ) {
    await db
      .update(orders)
      .set({ status: "failed" })
      .where(eq(orders.id, order.id));
    return {
      ok: false,
      code: "PROVIDER_ERROR",
      message: "Invalid response from the payment provider.",
    };
  }

  const saved = await db
    .update(orders)
    .set({
      provider: payment.provider,
      providerReference: payment.providerReference,
      paymentUrl: payment.paymentUrl,
    })
    .where(eq(orders.id, order.id))
    .returning();

  const updated = saved[0] ?? {
    ...order,
    provider: payment.provider,
    providerReference: payment.providerReference,
    paymentUrl: payment.paymentUrl,
  };

  return {
    ok: true,
    order: updated,
    paymentUrl: payment.paymentUrl,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
