"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreatePlanForm } from "@/components/admin/create-plan-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="shrink-0">
          <Plus className="size-4" aria-hidden />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create plan</DialogTitle>
        </DialogHeader>
        <CreatePlanForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
