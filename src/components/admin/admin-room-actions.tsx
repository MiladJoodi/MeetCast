"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteRoomAsAdminAction,
  endRoomAsAdminAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const initialState: AdminActionState = { ok: false };

type EndAdminRoomButtonProps = {
  roomId: string;
  roomTitle: string;
};

export function EndAdminRoomButton({
  roomId,
  roomTitle,
}: EndAdminRoomButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    endRoomAsAdminAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <>
      <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={() => setOpen(true)}
        >
          {pending ? "Ending…" : "End now"}
        </Button>
        {state.message && !state.ok ? (
          <p role="alert" className="text-xs text-destructive sm:text-right">
            {state.message}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="End room now?"
        description={`Participants in “${roomTitle}” will be disconnected.`}
        confirmLabel="End"
        confirmingLabel="Ending…"
        pending={pending}
        destructive
        onConfirm={() => {
          const formData = new FormData();
          formData.set("roomId", roomId);
          startTransition(() => {
            formAction(formData);
          });
        }}
      />
    </>
  );
}

type DeleteAdminRoomButtonProps = {
  roomId: string;
  roomTitle: string;
};

export function DeleteAdminRoomButton({
  roomId,
  roomTitle,
}: DeleteAdminRoomButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteRoomAsAdminAction,
    initialState,
  );

  return (
    <>
      <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={() => setOpen(true)}
        >
          {pending ? "Deleting…" : "Delete"}
        </Button>
        {state.message ? (
          <p role="alert" className="text-xs text-destructive sm:text-right">
            {state.message}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete room?"
        description={`“${roomTitle}” will be removed permanently. This cannot be undone.`}
        confirmLabel="Delete"
        confirmingLabel="Deleting…"
        pending={pending}
        destructive
        onConfirm={() => {
          const formData = new FormData();
          formData.set("roomId", roomId);
          startTransition(() => {
            formAction(formData);
          });
        }}
      />
    </>
  );
}
