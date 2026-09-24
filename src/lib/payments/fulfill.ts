import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders, users, type Order } from "@/db/schema";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getPlanById } from "@/lib/plans/queries";

export type FulfillPaidOrderResult = {
  order: Order;
  /** True when this call transitioned pending → paid and assigned the plan. */
  fulfilled: boolean;
  /** True when the order was already paid (idempotent no-op). */
  alreadyPaid: boolean;
};

/**
 * Mark order paid (if still pending) and assign the purchased plan.
 * Idempotent: paid → paid does not re-assign or create side effects.
 */
export async function fulfillPaidOrder(
  orderId: string,
): Promise<FulfillPaidOrderResult> {
  const existingRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    throw new AppError("NOT_FOUND", "Order not found.", 404);
  }

  if (existing.status === "paid") {
    return { order: existing, fulfilled: false, alreadyPaid: true };
  }

  if (existing.status !== "pending") {
    throw new AppError(
      "CONFLICT",
      "Order cannot be fulfilled in its current status.",
      409,
    );
  }

  const plan = await getPlanById(existing.planId);
  if (!plan || !plan.isActive) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Purchased plan is no longer available.",
      400,
    );
  }

  // Conditional update — only one concurrent caller wins the transition.
  const updated = await db
    .update(orders)
    .set({ status: "paid" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning();

  const paidOrder = updated[0];
  if (!paidOrder) {
    const again = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    const row = again[0];
    if (row?.status === "paid") {
      return { order: row, fulfilled: false, alreadyPaid: true };
    }
    throw new AppError(
      "CONFLICT",
      "Order could not be marked as paid.",
      409,
    );
  }

  await db
    .update(users)
    .set({ planId: paidOrder.planId })
    .where(eq(users.id, paidOrder.userId));

  await writeAdminAuditLog({
    actorUserId: paidOrder.userId,
    action: "order.paid",
    targetType: "order",
    targetId: paidOrder.id,
    metadata: {
      planId: paidOrder.planId,
      amount: paidOrder.amount,
      currency: paidOrder.currency,
      provider: paidOrder.provider,
    },
  });

  await writeAdminAuditLog({
    actorUserId: paidOrder.userId,
    action: "user.plan_changed",
    targetType: "user",
    targetId: paidOrder.userId,
    metadata: {
      planId: paidOrder.planId,
      source: "order",
      orderId: paidOrder.id,
    },
  });

  logger.info("payments.order_fulfilled", {
    orderId: paidOrder.id,
    planId: paidOrder.planId,
  });

  return { order: paidOrder, fulfilled: true, alreadyPaid: false };
}
