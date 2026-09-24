"use client";

import { useActionState } from "react";

import {
  joinRoomAsMemberAction,
  type RoomActionState,
} from "@/app/actions/rooms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: RoomActionState = { ok: false };

type MemberJoinButtonProps = {
  inviteCode: string;
  tone?: "default" | "room";
};

export function MemberJoinButton({
  inviteCode,
  tone = "default",
}: MemberJoinButtonProps) {
  const [state, formAction, pending] = useActionState(
    joinRoomAsMemberAction,
    initialState,
  );
  const room = tone === "room";

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="inviteCode" value={inviteCode} />
      {state.message ? (
        <p
          role="alert"
          className={cn(
            "text-sm",
            room
              ? "text-[color-mix(in_oklch,var(--danger)_90%,white)]"
              : "text-destructive",
          )}
        >
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className={cn(
          "w-full",
          room &&
            "border-transparent bg-white text-[oklch(0.2_0.03_160)] hover:bg-white/90",
        )}
        disabled={pending}
      >
        {pending ? "Joining…" : "Join with your account"}
      </Button>
    </form>
  );
}
