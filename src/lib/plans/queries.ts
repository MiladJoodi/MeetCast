import "server-only";

import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { plans, users, type Plan } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { FREE_PLAN_SLUG } from "@/lib/plans/constants";

export async function getPlanById(planId: string): Promise<Plan | null> {
  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function requirePlanById(planId: string): Promise<Plan> {
  const plan = await getPlanById(planId);
  if (!plan) {
    throw new AppError("NOT_FOUND", "Plan not found.", 404);
  }
  return plan;
}

export async function getFreePlan(): Promise<Plan> {
  const plan = await getPlanBySlug(FREE_PLAN_SLUG);
  if (!plan) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Default Free plan is not configured.",
      500,
    );
  }
  return plan;
}

export async function getActivePlans(): Promise<Plan[]> {
  return db.select().from(plans).where(eq(plans.isActive, true));
}

export async function getAllPlans(): Promise<Plan[]> {
  return db.select().from(plans);
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const rows = await db
    .select({ plan: plans })
    .from(users)
    .innerJoin(plans, eq(users.planId, plans.id))
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    const free = await getFreePlan();
    await db.update(users).set({ planId: free.id }).where(eq(users.id, userId));
    return free;
  }
  return row.plan;
}

export async function countUsersOnPlan(planId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.planId, planId));
  return Number(row?.value ?? 0);
}

/** Single query: planId → assigned user count (avoids N+1 on admin plans list). */
export async function countUsersByPlanId(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      planId: users.planId,
      value: count(),
    })
    .from(users)
    .groupBy(users.planId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.planId, Number(row.value));
  }
  return map;
}
