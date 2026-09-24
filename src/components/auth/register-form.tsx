"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  registerAction,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { withNextParam } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { ok: false };

type RegisterFormProps = {
  nextPath?: string | null;
};

export function RegisterForm({ nextPath }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? (
        <input type="hidden" name="next" value={nextPath} />
      ) : null}

      {state.message ? (
        <p role="alert" className={authAlertClassName}>
          {state.message}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="name" className={authLabelClassName}>
          Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          className={authFieldClassName}
        />
        {state.fieldErrors?.name ? (
          <p id="name-error" className={cn("text-sm", authErrorClassName)}>
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className={authLabelClassName}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? "email-error" : undefined
          }
          className={authFieldClassName}
        />
        {state.fieldErrors?.email ? (
          <p id="email-error" className={cn("text-sm", authErrorClassName)}>
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className={authLabelClassName}>
          Password
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          className={authFieldClassName}
          toggleClassName="text-white/45 hover:bg-white/10 hover:text-white"
        />
        {state.fieldErrors?.password ? (
          <p id="password-error" className={cn("text-sm", authErrorClassName)}>
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
          aria-describedby={
            state.fieldErrors?.confirmPassword
              ? "confirm-password-error"
              : undefined
          }
          className={authFieldClassName}
          toggleClassName="text-white/45 hover:bg-white/10 hover:text-white"
        />
        {state.fieldErrors?.confirmPassword ? (
          <p
            id="confirm-password-error"
            className={cn("text-sm", authErrorClassName)}
          >
            {state.fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className={cn("w-full", authPrimaryButtonClassName)}
        disabled={pending}
      >
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-white/55">
        Already have an account?{" "}
        <Link
          href={withNextParam("/login", nextPath)}
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
