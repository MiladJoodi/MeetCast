"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleStop } from "lucide-react";

import {
  endRoomAsHostAction,
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

type EndMeetingButtonProps = {
  roomId: string;
  roomTitle: string;
  size?: "default" | "sm" | "icon";
  /** Icon + label row for overflow menus. */
  menuItem?: boolean;
  onMenuSelect?: () => void;
  /** Hide the trigger; pair with controlled `open` from a parent menu. */
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function EndMeetingButton({
  roomId,
  roomTitle,
  size = "default",
  menuItem = false,
  onMenuSelect,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
}: EndMeetingButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = controlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;
  const [state, action, pending] = useActionState(
    endRoomAsHostAction,
    initialState,
  );
  const iconOnly = size === "icon" && !menuItem;

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok, setOpen]);

  function openConfirm() {
    onMenuSelect?.();
    setOpen(true);
  }

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className={
          hideTrigger ? "hidden" : "inline-flex w-full flex-col"
        }
      >
        <input type="hidden" name="roomId" value={roomId} />
        {hideTrigger ? null : menuItem ? (
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:opacity-40"
            onClick={openConfirm}
          >
            <CircleStop className="size-4 shrink-0" aria-hidden />
            {pending ? "Ending…" : "End meeting"}
          </button>
        ) : iconOnly ? (
          <Button
            type="button"
            variant="ghost"
            size={ROOM_ACTION_ICON_SIZE}
            disabled={pending}
            aria-label={`End ${roomTitle}`}
            title="End"
            className={ROOM_ACTION_ICON_DANGER}
            onClick={openConfirm}
          >
            <CircleStop
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
            onClick={openConfirm}
          >
            {pending ? "Ending…" : "End"}
          </Button>
        )}
        {state.message && !state.ok ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {state.message}
          </p>
        ) : null}
      </form>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="End meeting?"
        description={`“${roomTitle}” will close now and everyone will be disconnected.`}
        confirmLabel="End"
        confirmingLabel="Ending…"
        pending={pending}
        destructive
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}
