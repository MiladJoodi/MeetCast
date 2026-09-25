"use client";

import { useActionState } from "react";

import {
  demoLoginAction,
  type AuthActionState,
} from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { ok: false };

type DemoLoginButtonProps = {
  className?: string;
  /** default = landing inline · mobile/full = full-width bars */
  size?: "default" | "mobile" | "full";
};

export function DemoLoginButton({
  className,
  size = "default",
}: DemoLoginButtonProps) {
  const [state, formAction, pending] = useActionState(
    demoLoginAction,
    initialState,
  );

  const fullWidth = size === "mobile" || size === "full";

  return (
    <form
      action={formAction}
      className={cn(fullWidth ? "w-full space-y-1.5" : "contents", className)}
    >
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mc-stage-demo-btn group relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-[color-mix(in_oklch,var(--live)_45%,white)]/50 bg-[color-mix(in_oklch,var(--live)_14%,transparent)] font-semibold tracking-[-0.02em] text-white transition-[background-color,border-color,opacity,transform] duration-200 hover:border-[color-mix(in_oklch,var(--live)_70%,white)]/70 hover:bg-[color-mix(in_oklch,var(--live)_22%,transparent)] disabled:opacity-60",
          fullWidth ? "h-11 w-full text-[0.9375rem]" : "h-11 px-5 text-sm",
        )}
      >
        <span
          aria-hidden
          className="mc-stage-demo-shine pointer-events-none absolute inset-0"
        />
        <span className="relative flex items-center gap-2">
          <span className="mc-stage-live-dot" />
          {pending ? "Opening demo…" : "Try demo"}
        </span>
      </button>
      {state.message ? (
        <p
          role="alert"
          className={cn(
            "text-xs text-[color-mix(in_oklch,var(--danger)_80%,white)]",
            fullWidth ? "text-center" : "sm:absolute sm:mt-1",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
