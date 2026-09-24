"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  updateProfileAction,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: SettingsActionState = { ok: false };

type ProfileFormProps = {
  name: string;
  email: string;
};

export function ProfileForm({ name, email }: ProfileFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Profile updated.");
      router.refresh();
      return;
    }
    if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Display name</Label>
        <Input
          id="profile-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={name}
          disabled={pending}
          maxLength={80}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={
            state.fieldErrors?.name ? "profile-name-error" : undefined
          }
          className={cn(state.fieldErrors?.name && "border-destructive")}
        />
        {state.fieldErrors?.name ? (
          <p id="profile-name-error" className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={email}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? "profile-email-error" : undefined
          }
          className={cn(state.fieldErrors?.email && "border-destructive")}
        />
        {state.fieldErrors?.email ? (
          <p id="profile-email-error" className="text-xs text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
