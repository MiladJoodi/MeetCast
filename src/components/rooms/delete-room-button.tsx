"use client";

import { useActionState, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  deleteRoomAction,
  type RoomActionState,
} from "@/app/actions/rooms";
import {
  ROOM_ACTION_ICON_DANGER,
  ROOM_ACTION_ICON_SIZE,
  ROOM_ACTION_STROKE,
  ROOM_ACTION_SVG,
} from "@/components/rooms/room-action-styles";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

const initialState: RoomActionState = { ok: false };

type DeleteRoomButtonProps = {
  roomId: string;
  roomTitle: string;
  size?: "default" | "sm" | "icon";
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeleteRoomButton({
  roomId,
  roomTitle,
  size = "default",
  hideTrigger = false,
  open: openProp,
  onOpenChange,
}: DeleteRoomButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = controlled
    ? (onOpenChange ?? (() => {}))
    : setUncontrolledOpen;
  const [state, formAction, pending] = useActionState(
    deleteRoomAction,
    initialState,
  );
  const iconOnly = size === "icon";

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className={hideTrigger ? "hidden" : "inline-flex flex-col"}
      >
        <input type="hidden" name="roomId" value={roomId} />
        {state.message ? (
          <p role="alert" className="mb-1 text-xs text-destructive">
            {state.message}
          </p>
        ) : null}
        {hideTrigger ? null : iconOnly ? (
          <Button
            type="button"
            variant="ghost"
            size={ROOM_ACTION_ICON_SIZE}
            disabled={pending}
            aria-label={`Delete room ${roomTitle}`}
            title="Delete"
            className={ROOM_ACTION_ICON_DANGER}
            onClick={() => setOpen(true)}
          >
            <Trash2
              className={ROOM_ACTION_SVG}
              strokeWidth={ROOM_ACTION_STROKE}
            />
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size={size === "sm" ? "sm" : "default"}
            disabled={pending}
            aria-label={`Delete room ${roomTitle}`}
            onClick={() => setOpen(true)}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        )}
      </form>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete room?"
        description={`“${roomTitle}” will be removed permanently. This cannot be undone.`}
        confirmLabel="Delete"
        confirmingLabel="Deleting…"
        pending={pending}
        destructive
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}
