"use client";

import { useActionState, useRef, useState } from "react";

import {
  deleteUserAsAdminAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const initialState: AdminActionState = { ok: false };

type DeleteUserFormProps = {
  userId: string;
  userName: string;
  disabled?: boolean;
};

export function DeleteUserForm({
  userId,
  userName,
  disabled,
}: DeleteUserFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteUserAsAdminAction,
    initialState,
  );

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
          variant="destructive"
          size="sm"
          className="w-full sm:w-auto"
          disabled={pending || disabled}
          onClick={() => setOpen(true)}
        >
          {pending ? "Deleting…" : "Delete"}
        </Button>
        {disabled ? (
          <p className="text-xs text-muted-foreground sm:text-right">
            Use Settings for your account
          </p>
        ) : null}
        {state.message ? (
          <p role="alert" className="text-xs text-destructive sm:text-right">
            {state.message}
          </p>
        ) : null}
      </form>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete user?"
        description={`“${userName}” and their hosted rooms will be removed permanently. This cannot be undone.`}
        confirmLabel="Delete"
        confirmingLabel="Deleting…"
        pending={pending}
        destructive
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}
