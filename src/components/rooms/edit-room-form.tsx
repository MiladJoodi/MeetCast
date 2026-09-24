"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  updateRoomAction,
  type RoomActionState,
} from "@/app/actions/rooms";
import { AllowedEmailsField } from "@/components/rooms/allowed-emails-field";
import {
  RoomVisibilityField,
  type RoomVisibilityValue,
} from "@/components/rooms/room-visibility-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_ROOM_PARTICIPANTS,
  ROOM_TITLE_MAX_LENGTH,
} from "@/lib/rooms/constants";
import {
  dateFromDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/rooms/datetime-local";

const initialState: RoomActionState = { ok: false };

type EditRoomFormProps = {
  roomId: string;
  title: string;
  maxParticipants: number;
  startTime: Date;
  endTime: Date;
  scheduleEditable: boolean;
  planMaxParticipants?: number;
  visibility?: RoomVisibilityValue;
  allowedEmails?: string[];
};

export function EditRoomForm({
  roomId,
  title,
  maxParticipants,
  startTime,
  endTime,
  scheduleEditable,
  planMaxParticipants,
  visibility: initialVisibility = "public",
  allowedEmails = [],
}: EditRoomFormProps) {
  const router = useRouter();
  const [startLocal, setStartLocal] = useState(() =>
    toDatetimeLocalValue(startTime),
  );
  const [endLocal, setEndLocal] = useState(() => toDatetimeLocalValue(endTime));
  const [visibility, setVisibility] =
    useState<RoomVisibilityValue>(initialVisibility);
  const [state, formAction, pending] = useActionState(
    updateRoomAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const participantCap = Math.min(
    planMaxParticipants ?? MAX_ROOM_PARTICIPANTS,
    MAX_ROOM_PARTICIPANTS,
  );

  const startIso =
    dateFromDatetimeLocal(startLocal)?.toISOString() ??
    startTime.toISOString();
  const endIso =
    dateFromDatetimeLocal(endLocal)?.toISOString() ?? endTime.toISOString();

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="startTime" value={startIso} />
      <input type="hidden" name="endTime" value={endIso} />

      {state.message ? (
        <p
          role="alert"
          className={
            state.ok
              ? "rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
              : "rounded-md border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_5rem] items-start gap-2.5">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="title" className="text-xs text-muted-foreground">
            Title
          </Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={ROOM_TITLE_MAX_LENGTH}
            defaultValue={title.slice(0, ROOM_TITLE_MAX_LENGTH)}
            key={`title-${title}`}
            disabled={pending}
          />
          {state.fieldErrors?.title ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.title[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="maxParticipants"
            className="text-xs text-muted-foreground"
          >
            People
          </Label>
          <Input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            required
            min={2}
            max={participantCap}
            defaultValue={maxParticipants}
            key={`max-${maxParticipants}`}
            disabled={pending}
          />
          {state.fieldErrors?.maxParticipants ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.maxParticipants[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor="startTimeLocal"
            className="text-xs text-muted-foreground"
          >
            Starts
          </Label>
          <Input
            id="startTimeLocal"
            type="datetime-local"
            required
            disabled={pending || !scheduleEditable}
            value={startLocal}
            onChange={(event) => setStartLocal(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="endTimeLocal"
            className="text-xs text-muted-foreground"
          >
            Ends
          </Label>
          <Input
            id="endTimeLocal"
            type="datetime-local"
            required
            disabled={pending || !scheduleEditable}
            value={endLocal}
            onChange={(event) => setEndLocal(event.target.value)}
          />
        </div>
      </div>

      {!scheduleEditable ? (
        <p className="text-xs text-muted-foreground">
          Schedule is locked while the room is live or ended.
        </p>
      ) : null}

      {state.fieldErrors?.startTime || state.fieldErrors?.endTime ? (
        <p className="text-xs text-destructive">
          {state.fieldErrors.startTime?.[0] ?? state.fieldErrors.endTime?.[0]}
        </p>
      ) : null}

      <RoomVisibilityField
        value={visibility}
        onChange={setVisibility}
        disabled={pending}
        error={state.fieldErrors?.visibility?.[0]}
      />

      <AllowedEmailsField
        key={`${initialVisibility}-${allowedEmails.join("|")}`}
        initialEmails={allowedEmails}
        active={visibility === "private"}
        disabled={pending}
        error={state.fieldErrors?.allowedEmails?.[0]}
      />

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
