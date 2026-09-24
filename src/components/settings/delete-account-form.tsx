"use client";

import { useActionState } from "react";

import {
  deleteAccountAction,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SettingsActionState = { ok: false };

type DeleteAccountFormProps = {
  hostedRoomCount: number;
};

export function DeleteAccountForm({ hostedRoomCount }: DeleteAccountFormProps) {
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        const roomsNote =
          hostedRoomCount > 0
            ? ` This permanently deletes ${hostedRoomCount} room${hostedRoomCount === 1 ? "" : "s"} you host.`
            : "";
        if (
          !window.confirm(
            `Delete your MeetCast account permanently?${roomsNote} This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      {state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Deleting your account signs you out, removes your memberships, and
        permanently deletes rooms you host
        {hostedRoomCount > 0
          ? ` (${hostedRoomCount} currently)`
          : ""}
        . Rooms hosted by others are not deleted.
      </p>

      <div className="space-y-2">
        <Label htmlFor="delete-password">Confirm with your password</Label>
        <Input
          id="delete-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "delete-password-error" : undefined
          }
        />
        {state.fieldErrors?.password ? (
          <p id="delete-password-error" className="text-sm text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        variant="destructive"
        className="w-full sm:w-auto"
        disabled={pending}
      >
        {pending ? "Deleting…" : "Delete account"}
      </Button>
    </form>
  );
}
