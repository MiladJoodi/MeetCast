"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  loginAction,
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
import { DemoLoginButton } from "@/components/landing/demo-login-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { withNextParam } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { ok: false };

type LoginFormProps = {
  nextPath?: string | null;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="space-y-5">
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
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className={authLabelClassName}>
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-white/50 underline-offset-4 hover:text-white hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
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

        <Button
          type="submit"
          className={cn("w-full", authPrimaryButtonClassName)}
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative py-0.5">
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10"
        />
        <p className="relative mx-auto w-fit bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] px-2 text-[0.6875rem] tracking-wide text-white/40 uppercase">
          or
        </p>
      </div>

      <DemoLoginButton size="full" />

      <p className="text-center text-sm text-white/55">
        No account?{" "}
        <Link
          href={withNextParam("/register", nextPath)}
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
