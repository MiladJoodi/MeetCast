"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  revokeUserSessionsAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const initialState: AdminActionState = { ok: false };

type RevokeSessionsFormProps = {
  userId: string;
};

export function RevokeSessionsForm({ userId }: RevokeSessionsFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    revokeUserSessionsAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col items-stretch gap-1.5 sm:items-end"
      >
        <input type="hidden" name="userId" value={userId} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={() => setOpen(true)}
        >
          {pending ? "Revoking…" : "Revoke all"}
        </Button>
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

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke all sessions?"
        description="This user will be signed out on every device."
        confirmLabel="Revoke"
        confirmingLabel="Revoking…"
        pending={pending}
        destructive
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}
