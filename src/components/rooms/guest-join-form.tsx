"use client";

import { useActionState } from "react";

import {
  joinRoomAsGuestAction,
  type RoomActionState,
} from "@/app/actions/rooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: RoomActionState = { ok: false };

type GuestJoinFormProps = {
  inviteCode: string;
  tone?: "default" | "room";
};

export function GuestJoinForm({
  inviteCode,
  tone = "default",
}: GuestJoinFormProps) {
  const [state, formAction, pending] = useActionState(
    joinRoomAsGuestAction,
    initialState,
  );
  const room = tone === "room";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="inviteCode" value={inviteCode} />

      {state.message ? (
        <p
          role="alert"
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            room
              ? "border-danger/35 bg-danger/15 text-[color-mix(in_oklch,var(--danger)_90%,white)]"
              : "border-destructive/20 bg-destructive/10 text-destructive",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label
          htmlFor="displayName"
          className={room ? "text-white/70" : undefined}
        >
          Display name
        </Label>
        <Input
          id="displayName"
          name="displayName"
          required
          maxLength={80}
          disabled={pending}
          placeholder="How others will see you"
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          className={
            room
              ? "border-white/20 bg-white/8 text-white placeholder:text-white/35 focus-visible:border-white/40"
              : undefined
          }
        />
        {state.fieldErrors?.displayName ? (
          <p
            className={cn(
              "text-sm",
              room
                ? "text-[color-mix(in_oklch,var(--danger)_90%,white)]"
                : "text-destructive",
            )}
          >
            {state.fieldErrors.displayName[0]}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className={cn(
          "w-full",
          room &&
            "border-transparent bg-white text-[oklch(0.2_0.03_160)] hover:bg-white/90",
        )}
        disabled={pending}
      >
        {pending ? "Joining…" : "Join as guest"}
      </Button>
    </form>
  );
}
