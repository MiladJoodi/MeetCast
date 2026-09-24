import "server-only";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { getOrderById } from "@/lib/orders/queries";
import { fulfillPaidOrder } from "@/lib/payments/fulfill";
import { getPaymentProvider } from "@/lib/payments/provider";
import { logger } from "@/lib/logger";

function redirectResult(
  status: "success" | "cancelled" | "failed" | "error",
  orderId?: string,
): never {
  const params = new URLSearchParams({ status });
  if (orderId) {
    params.set("orderId", orderId);
  }
  redirect(`/billing/result?${params.toString()}`);
}

/**
 * Handle ZarinPal (and compatible) browser callback.
 * Never trust Status alone — always verify server-to-server before fulfillment.
 */
export async function handlePaymentCallback(input: {
  orderId: string | null;
  authority: string | null;
  gatewayStatus: string | null;
}): Promise<never> {
  const orderId = input.orderId?.trim() || null;
  const authority = input.authority?.trim() || null;
  const gatewayStatus = (input.gatewayStatus ?? "").trim().toUpperCase();

  if (!orderId) {
    logger.warn("payments.callback_missing_order");
    redirectResult("error");
  }

  const order = await getOrderById(orderId);
  if (!order) {
    logger.warn("payments.callback_unknown_order", { orderId });
    redirectResult("error", orderId);
  }

  if (order.status === "paid") {
    redirectResult("success", order.id);
  }

  if (gatewayStatus && gatewayStatus !== "OK") {
    if (order.status === "pending") {
      await db
        .update(orders)
        .set({ status: "cancelled" })
        .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    }
    redirectResult("cancelled", order.id);
  }

  if (!authority) {
    if (order.status === "pending") {
      await db
        .update(orders)
        .set({ status: "failed" })
        .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    }
    redirectResult("failed", order.id);
  }

  if (
    order.providerReference &&
    order.providerReference !== authority
  ) {
    logger.warn("payments.callback_authority_mismatch", { orderId: order.id });
    redirectResult("error", order.id);
  }

  let provider;
  try {
    provider = getPaymentProvider();
  } catch {
    redirectResult("error", order.id);
  }

  if (order.provider && order.provider !== provider.id) {
    logger.warn("payments.callback_provider_mismatch", { orderId: order.id });
    redirectResult("error", order.id);
  }

  const verified = await provider.verifyPayment({
    providerReference: authority,
    amount: order.amount,
    currency: order.currency,
  });

  if (!verified.ok) {
    logger.info("payments.verification_failed", {
      orderId: order.id,
      reason: verified.reason,
    });

    if (order.status === "pending") {
      const nextStatus =
        verified.reason === "cancelled" ? "cancelled" : "failed";
      await db
        .update(orders)
        .set({ status: nextStatus })
        .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    }

    if (verified.reason === "cancelled") {
      redirectResult("cancelled", order.id);
    }
    redirectResult("failed", order.id);
  }

  if (verified.amount !== order.amount) {
    logger.error("payments.amount_mismatch", {
      orderId: order.id,
      expected: order.amount,
      verified: verified.amount,
    });
    if (order.status === "pending") {
      await db
        .update(orders)
        .set({ status: "failed" })
        .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    }
    redirectResult("failed", order.id);
  }

  if (
    verified.providerReference &&
    order.providerReference &&
    verified.providerReference !== order.providerReference
  ) {
    logger.error("payments.reference_mismatch", { orderId: order.id });
    redirectResult("error", order.id);
  }

  // Persist reference if createPayment saved it but callback authority is source of truth.
  if (!order.providerReference || !order.provider) {
    await db
      .update(orders)
      .set({
        provider: verified.provider,
        providerReference: verified.providerReference,
      })
      .where(eq(orders.id, order.id));
  }

  try {
    await fulfillPaidOrder(order.id);
  } catch (error) {
    logger.error("payments.fulfill_failed", {
      orderId: order.id,
      error: error instanceof Error ? error.name : "unknown",
    });
    redirectResult("error", order.id);
  }

  redirectResult("success", order.id);
}
