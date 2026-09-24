import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders, plans, users, type Order } from "@/db/schema";
import { AppError } from "@/lib/errors";

export async function getOrderById(orderId: string): Promise<Order | null> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireOrderById(orderId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new AppError("NOT_FOUND", "Order not found.", 404);
  }
  return order;
}

export async function getOrderForUser(
  orderId: string,
  userId: string,
): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order || order.userId !== userId) {
    return null;
  }
  return order;
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export type AdminOrderRow = Order & {
  userName: string;
  userEmail: string;
  planSlug: string;
};

export async function listOrdersForAdmin(limit = 100): Promise<AdminOrderRow[]> {
  const rows = await db
    .select({
      order: orders,
      userName: users.name,
      userEmail: users.email,
      planSlug: plans.slug,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(plans, eq(orders.planId, plans.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row.order,
    userName: row.userName,
    userEmail: row.userEmail,
    planSlug: row.planSlug,
  }));
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
): Promise<Order | null> {
  const updated = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, orderId))
    .returning();
  return updated[0] ?? null;
}
