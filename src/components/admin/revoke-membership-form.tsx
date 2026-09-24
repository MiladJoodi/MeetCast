"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  revokeUserMembershipAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const initialState: AdminActionState = { ok: false };

type RevokeMembershipFormProps = {
  userId: string;
  userName: string;
  planName: string;
  alreadyFree: boolean;
};

export function RevokeMembershipForm({
  userId,
  userName,
  planName,
  alreadyFree,
}: RevokeMembershipFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    revokeUserMembershipAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
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
          disabled={pending || alreadyFree}
          onClick={() => setOpen(true)}
        >
          {pending ? "Revoking…" : "Revoke"}
        </Button>
        {alreadyFree ? (
          <p className="text-xs text-muted-foreground sm:text-right">
            Already on Free
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

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke membership?"
        description={`“${userName}” will move from ${planName} to Free. The account stays; they can still sign in.`}
        confirmLabel="Revoke"
        confirmingLabel="Revoking…"
        pending={pending}
        destructive
        onConfirm={() => {
          formRef.current?.requestSubmit();
          setOpen(false);
        }}
      />
    </>
  );
}
