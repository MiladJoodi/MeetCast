"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  changeUserRoleAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

const initialState: AdminActionState = { ok: false };

type ChangeRoleFormProps = {
  userId: string;
  currentRole: "user" | "admin";
  isSelf: boolean;
};

export function ChangeRoleForm({
  userId,
  currentRole,
  isSelf,
}: ChangeRoleFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    changeUserRoleAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  const nextRole = currentRole === "admin" ? "user" : "admin";
  const blocked = isSelf && currentRole === "admin";

  return (
    <form action={formAction} className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={nextRole} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled={pending || blocked}
        title={
          blocked ? "You cannot demote your own admin account." : undefined
        }
      >
        {pending
          ? "Updating…"
          : nextRole === "admin"
            ? "Make admin"
            : "Make user"}
      </Button>
      {blocked ? (
        <p className="text-xs text-muted-foreground sm:text-right">
          Can’t demote yourself
        </p>
      ) : null}
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
