"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  resetPasswordAction,
  type AuthActionState,
} from "@/app/actions/auth";
import {
  authAlertClassName,
  authErrorClassName,
  authFieldClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { ok: false };

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.message ? (
        <p role="alert" className={authAlertClassName}>
          {state.message}{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="password" className={authLabelClassName}>
          New password
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          invalid={Boolean(state.fieldErrors?.password)}
          className={authFieldClassName}
          toggleClassName="text-white/45 hover:bg-white/10 hover:text-white"
        />
        {state.fieldErrors?.password ? (
          <p className={cn("text-sm", authErrorClassName)}>
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className={authLabelClassName}>
          Confirm password
        </Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          invalid={Boolean(state.fieldErrors?.confirmPassword)}
          className={authFieldClassName}
          toggleClassName="text-white/45 hover:bg-white/10 hover:text-white"
        />
        {state.fieldErrors?.confirmPassword ? (
          <p className={cn("text-sm", authErrorClassName)}>
            {state.fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className={cn("w-full", authPrimaryButtonClassName)}
        disabled={pending}
      >
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
