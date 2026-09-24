"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  deletePlanAction,
  updatePlanAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AdminActionState = { ok: false };

type PlanFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  maxConcurrentParticipants: number;
  maxRoomDurationMinutes: number | null;
  priceAmount: number;
  currency: string;
  isActive: boolean;
  assignedUserCount: number;
};

export function EditPlanForm({ plan }: { plan: PlanFormValues }) {
  const router = useRouter();
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updatePlanAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePlanAction,
    initialState,
  );

  const canDelete = plan.assignedUserCount === 0;

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Plan updated.");
      router.refresh();
      return;
    }
    if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [router, state]);

  useEffect(() => {
    if (deleteState.message && !deleteState.ok) {
      toast.error(deleteState.message);
    }
  }, [deleteState]);

  return (
    <div className="space-y-4">
      <form id="edit-plan-form" action={formAction} className="space-y-4">
        <input type="hidden" name="planId" value={plan.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              name="name"
              required
              defaultValue={plan.name}
              disabled={pending}
              aria-invalid={Boolean(state.fieldErrors?.name)}
            />
            {state.fieldErrors?.name ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-slug">Slug</Label>
            <Input
              id="edit-slug"
              name="slug"
              required
              defaultValue={plan.slug}
              disabled={pending}
              aria-invalid={Boolean(state.fieldErrors?.slug)}
              className={cn(state.fieldErrors?.slug && "border-destructive")}
            />
            {state.fieldErrors?.slug ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.slug[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              name="description"
              defaultValue={plan.description ?? ""}
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
            <Label htmlFor="edit-concurrent">Max concurrent</Label>
            <Input
              id="edit-concurrent"
              name="maxConcurrentParticipants"
              type="number"
              min={1}
              max={50}
              required
              defaultValue={plan.maxConcurrentParticipants}
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
            <Label htmlFor="edit-duration">Max duration (min)</Label>
            <Input
              id="edit-duration"
              name="maxRoomDurationMinutes"
              type="number"
              min={5}
              max={240}
              placeholder="Unlimited"
              defaultValue={plan.maxRoomDurationMinutes ?? ""}
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
            <Label htmlFor="edit-price">Price (IRR rials)</Label>
            <Input
              id="edit-price"
              name="priceAmount"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={plan.priceAmount}
              disabled={pending}
              aria-invalid={Boolean(state.fieldErrors?.priceAmount)}
            />
            {state.fieldErrors?.priceAmount ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.priceAmount[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-currency">Currency</Label>
            <Input
              id="edit-currency"
              name="currency"
              required
              defaultValue={plan.currency}
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
            <Label htmlFor="edit-active">Status</Label>
            <select
              id="edit-active"
              name="isActive"
              defaultValue={plan.isActive ? "true" : "false"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              disabled={pending}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </form>

      <form ref={deleteFormRef} action={deleteAction} className="hidden">
        <input type="hidden" name="planId" value={plan.id} />
      </form>

      <div className="space-y-3 border-t border-border/80 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="submit"
            form="edit-plan-form"
            className="w-full sm:w-auto"
            disabled={pending || deletePending}
          >
            {pending ? "Saving…" : "Save plan"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={deletePending || pending || !canDelete}
            onClick={() => setDeleteOpen(true)}
          >
            {deletePending ? "Deleting…" : "Delete plan"}
          </Button>
        </div>
        {!canDelete ? (
          <p className="text-sm text-muted-foreground">
            {plan.assignedUserCount} user
            {plan.assignedUserCount === 1 ? "" : "s"} assigned — reassign them
            before deleting.
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete plan?"
        description={`“${plan.name}” will be removed permanently. This cannot be undone.`}
        confirmLabel="Delete plan"
        confirmingLabel="Deleting…"
        pending={deletePending}
        destructive
        onConfirm={() => deleteFormRef.current?.requestSubmit()}
      />
    </div>
  );
}
