"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createPlanAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyPlanName } from "@/lib/plans/slug";
import { cn } from "@/lib/utils";

const initialState: AdminActionState = { ok: false };

type CreatePlanFormProps = {
  onSuccess?: () => void;
};

export function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createPlanAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Plan created.");
      router.refresh();
      onSuccess?.();
      return;
    }
    if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [onSuccess, router, state]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="plan-name">Name</Label>
          <Input
            id="plan-name"
            name="name"
            required
            value={name}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            onChange={(event) => {
              const next = event.target.value;
              setName(next);
              if (!slugTouched) {
                setSlug(slugifyPlanName(next));
              }
            }}
          />
          {state.fieldErrors?.name ? (
            <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-slug">Slug</Label>
          <Input
            id="plan-slug"
            name="slug"
            required
            value={slug}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.slug)}
            className={cn(state.fieldErrors?.slug && "border-destructive")}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
          />
          {state.fieldErrors?.slug ? (
            <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Auto-filled from name — edit anytime.
            </p>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="plan-description">Description</Label>
          <Input
            id="plan-description"
            name="description"
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.description)}
          />
          {state.fieldErrors?.description ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.description[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-concurrent">Max concurrent</Label>
          <Input
            id="plan-concurrent"
            name="maxConcurrentParticipants"
            type="number"
            min={1}
            max={50}
            required
            disabled={pending}
            aria-invalid={Boolean(
              state.fieldErrors?.maxConcurrentParticipants,
            )}
          />
          {state.fieldErrors?.maxConcurrentParticipants ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.maxConcurrentParticipants[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-duration">Max duration (min)</Label>
          <Input
            id="plan-duration"
            name="maxRoomDurationMinutes"
            type="number"
            min={5}
            max={240}
            placeholder="Unlimited"
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.maxRoomDurationMinutes)}
          />
          {state.fieldErrors?.maxRoomDurationMinutes ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.maxRoomDurationMinutes[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-price">Price (IRR rials)</Label>
          <Input
            id="plan-price"
            name="priceAmount"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.priceAmount)}
          />
          {state.fieldErrors?.priceAmount ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.priceAmount[0]}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              One-time purchase amount. Use 0 for free plans.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-currency">Currency</Label>
          <Input
            id="plan-currency"
            name="currency"
            defaultValue="IRR"
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.currency)}
          />
          {state.fieldErrors?.currency ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.currency[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="plan-active">Status</Label>
          <select
            id="plan-active"
            name="isActive"
            defaultValue="true"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={pending}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create plan"}
      </Button>
    </form>
  );
}
