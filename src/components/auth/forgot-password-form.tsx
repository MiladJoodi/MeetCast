"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  forgotPasswordAction,
  type AuthActionState,
} from "@/app/actions/auth";
import {
  authAlertClassName,
  authFieldClassName,
  authLabelClassName,
  authNoticeClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { ok: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div
          role="status"
          className={state.ok ? authNoticeClassName : authAlertClassName}
        >
          <p>{state.message}</p>
          {state.fallbackLink ? (
            <p className="mt-2 break-all">
              <a
                href={state.fallbackLink}
                className="font-medium text-white underline-offset-4 hover:underline"
              >
                {state.fallbackLink}
              </a>
            </p>
          ) : null}
        </div>
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
          disabled={pending || state.ok}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className={authFieldClassName}
        />
        {state.fieldErrors?.email ? (
          <p className="text-sm text-[color-mix(in_oklch,var(--danger)_90%,white)]">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      {!state.ok ? (
        <Button
          type="submit"
          className={cn("w-full", authPrimaryButtonClassName)}
          disabled={pending}
        >
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      ) : (
        <Button
          className={cn("w-full", authPrimaryButtonClassName)}
          asChild
        >
          <Link href="/login">Back to log in</Link>
        </Button>
      )}
    </form>
  );
}
