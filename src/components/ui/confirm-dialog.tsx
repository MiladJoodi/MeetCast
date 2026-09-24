"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmingLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

/** Simple confirm modal — replaces window.confirm for room actions. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmingLabel = "Working…",
  pending = false,
  destructive = false,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader className="pr-0">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="-mx-5 -mb-5 grid grid-cols-2 gap-2 border-t border-border/80 bg-muted/25 p-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="w-full"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
