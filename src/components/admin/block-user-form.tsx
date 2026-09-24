"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  setUserBlockAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const initialState: AdminActionState = { ok: false };

type BlockUserFormProps = {
  userId: string;
  userName: string;
  blocked: boolean;
  disabled?: boolean;
};

/**
 * Remount when server `blocked` flips so useActionState resets and the next
 * toggle works without a manual full-page refresh.
 */
export function BlockUserForm(props: BlockUserFormProps) {
  return (
    <BlockUserFormInner
      key={props.blocked ? "blocked" : "active"}
      {...props}
    />
  );
}

function BlockUserFormInner({
  userId,
  userName,
  blocked,
  disabled,
}: BlockUserFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    setUserBlockAction,
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
        <input
          type="hidden"
          name="intent"
          value={blocked ? "unblock" : "block"}
        />
        <Button
          type="button"
          variant={blocked ? "outline" : "destructive"}
          size="sm"
          className="w-full sm:w-auto"
          disabled={pending || disabled}
          onClick={() => setOpen(true)}
        >
          {pending
            ? blocked
              ? "Unblocking…"
              : "Blocking…"
            : blocked
              ? "Unblock"
              : "Block"}
        </Button>
        {disabled ? (
          <p className="text-xs text-muted-foreground sm:text-right">
            You can’t block yourself
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
        title={blocked ? "Unblock user?" : "Block user?"}
        description={
          blocked
            ? `“${userName}” will be able to sign in again.`
            : `“${userName}” will be signed out everywhere and cannot log in until unblocked.`
        }
        confirmLabel={blocked ? "Unblock" : "Block"}
        confirmingLabel={blocked ? "Unblocking…" : "Blocking…"}
        pending={pending}
        destructive={!blocked}
        onConfirm={() => {
          formRef.current?.requestSubmit();
          setOpen(false);
        }}
      />
    </>
  );
}
