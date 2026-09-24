"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  changePasswordAction,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SettingsActionState = { ok: false };

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.message ? (
        <p
          role="status"
          className={
            state.ok
              ? "rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
              : "rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
          aria-describedby={
            state.fieldErrors?.currentPassword
              ? "currentPassword-error"
              : undefined
          }
        />
        {state.fieldErrors?.currentPassword ? (
          <p id="currentPassword-error" className="text-sm text-destructive">
            {state.fieldErrors.currentPassword[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.newPassword)}
          aria-describedby={
            state.fieldErrors?.newPassword ? "newPassword-error" : undefined
          }
        />
        {state.fieldErrors?.newPassword ? (
          <p id="newPassword-error" className="text-sm text-destructive">
            {state.fieldErrors.newPassword[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">Confirm new password</Label>
        <Input
          id="confirmNewPassword"
          name="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.confirmNewPassword)}
          aria-describedby={
            state.fieldErrors?.confirmNewPassword
              ? "confirmNewPassword-error"
              : undefined
          }
        />
        {state.fieldErrors?.confirmNewPassword ? (
          <p id="confirmNewPassword-error" className="text-sm text-destructive">
            {state.fieldErrors.confirmNewPassword[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
