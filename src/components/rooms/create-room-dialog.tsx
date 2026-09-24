"use client";

import { Plus } from "lucide-react";

import { CreateRoomForm } from "@/components/rooms/create-room-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CreateRoomDialogProps = {
  maxDurationMinutes?: number;
  planMaxParticipants?: number;
};

export function CreateRoomDialog({
  maxDurationMinutes,
  planMaxParticipants,
}: CreateRoomDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" className="shrink-0">
          <Plus className="size-4" aria-hidden />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New meeting</DialogTitle>
        </DialogHeader>
        <CreateRoomForm
          maxDurationMinutes={maxDurationMinutes}
          planMaxParticipants={planMaxParticipants}
        />
      </DialogContent>
    </Dialog>
  );
}
