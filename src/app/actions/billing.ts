"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { toSafeClientError } from "@/lib/errors";
import { startCheckoutPayment } from "@/lib/payments/service";
import { getPlanById } from "@/lib/plans/queries";
import { assertCheckoutRateLimit } from "@/lib/security/rate-limit";

export type CheckoutActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const checkoutSchema = z.object({
  planId: z.string().uuid("Invalid plan."),
  idempotencyKey: z.string().uuid("Invalid checkout key."),
});

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

/**
 * Confirm checkout: create pending order → provider payment → redirect to gateway.
 */
export async function confirmCheckoutAction(
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  let user;
  try {
    ({ user } = await requireSession());
    await assertCheckoutRateLimit(user.id);
  } catch (error) {
    const safe = toSafeClientError(error);
    return { ok: false, message: safe.message };
  }

  const parsed = checkoutSchema.safeParse({
    planId: formString(formData, "planId"),
    idempotencyKey: formString(formData, "idempotencyKey"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const plan = await getPlanById(parsed.data.planId);
  if (!plan) {
    return { ok: false, message: "Plan not found." };
  }

  if (plan.id === user.planId) {
    return { ok: false, message: "You are already on this plan." };
  }

  const result = await startCheckoutPayment({
    user: { id: user.id, email: user.email },
    plan,
    idempotencyKey: parsed.data.idempotencyKey,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  redirect(result.paymentUrl);
}
