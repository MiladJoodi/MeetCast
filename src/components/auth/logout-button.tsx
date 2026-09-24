"use client";

import { useRef, useState, useTransition } from "react";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  label?: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  size?:
    | "default"
    | "sm"
    | "lg"
    | "icon"
    | "icon-sm"
    | "icon-lg"
    | "xs"
    | "icon-xs";
  className?: string;
  /** Show LogOut icon before the label. */
  showIcon?: boolean;
};

export function LogoutButton({
  label = "Log out",
  variant = "outline",
  size = "sm",
  className,
  showIcon = false,
}: LogoutButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <form ref={formRef} action={logoutAction} className="contents">
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
          disabled={pending}
          onClick={() => setOpen(true)}
        >
          {showIcon ? <LogOut className="size-4" aria-hidden /> : null}
          {label}
        </Button>
      </form>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Log out?"
        description="You’ll need to sign in again to open your desk."
        confirmLabel="Log out"
        confirmingLabel="Logging out…"
        pending={pending}
        onConfirm={() => {
          startTransition(() => {
            formRef.current?.requestSubmit();
          });
        }}
      />
    </>
  );
}
