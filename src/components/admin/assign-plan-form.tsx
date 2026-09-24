"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  assignUserPlanAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

const initialState: AdminActionState = { ok: false };

type AssignPlanFormProps = {
  userId: string;
  currentPlanId: string;
  plans: Array<{ id: string; name: string; slug: string }>;
};

export function AssignPlanForm({
  userId,
  currentPlanId,
  plans,
}: AssignPlanFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    assignUserPlanAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <form action={formAction} className="flex flex-col gap-1.5 sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <select
          id="assign-plan"
          name="planId"
          defaultValue={currentPlanId}
          aria-label="Plan"
          className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm sm:w-40"
          disabled={pending}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state.message ? (
        <p
          role="status"
          className={
            state.ok
              ? "text-xs text-muted-foreground sm:text-right"
              : "text-xs text-destructive sm:text-right"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
