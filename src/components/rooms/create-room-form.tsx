"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";

import {
  createRoomAction,
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
  dateFromDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/rooms/datetime-local";
import {
  getMaxRoomDurationMs,
  MAX_ROOM_PARTICIPANTS,
  ROOM_TITLE_MAX_LENGTH,
} from "@/lib/rooms/constants";
import { cn } from "@/lib/utils";

const initialState: RoomActionState = { ok: false };

const DURATION_OPTIONS_MIN = [30, 60, 120] as const;

function roundToMinute(date: Date) {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function formatLength(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return "1 h";
  return `${minutes / 60} h`;
}

type CreateRoomFormProps = {
  maxDurationMinutes?: number;
  planMaxParticipants?: number;
};

export function CreateRoomForm({
  maxDurationMinutes,
  planMaxParticipants,
}: CreateRoomFormProps) {
  const planMax = maxDurationMinutes ?? getMaxRoomDurationMs() / 60_000;
  const durationOptions = useMemo(() => {
    const filtered = DURATION_OPTIONS_MIN.filter((m) => m <= planMax);
    if (filtered.length > 0) return [...filtered];
    return [Math.max(5, Math.floor(planMax))];
  }, [planMax]);
  const defaultDuration =
    durationOptions.find((m) => m === 60) ??
    durationOptions[durationOptions.length - 1]!;

  const [durationMin, setDurationMin] = useState(defaultDuration);
  const [customSchedule, setCustomSchedule] = useState(false);
  const [visibility, setVisibility] =
    useState<RoomVisibilityValue>("public");
  const [startLocal, setStartLocal] = useState(() =>
    toDatetimeLocalValue(roundToMinute(new Date())),
  );
  const [endLocal, setEndLocal] = useState(() =>
    toDatetimeLocalValue(
      addMinutes(roundToMinute(new Date()), defaultDuration),
    ),
  );

  const [state, formAction, pending] = useActionState(
    createRoomAction,
    initialState,
  );

  const participantCap = Math.min(
    planMaxParticipants ?? MAX_ROOM_PARTICIPANTS,
    MAX_ROOM_PARTICIPANTS,
  );
  const defaultParticipants = Math.min(participantCap, 10);

  const startDate = customSchedule
    ? (dateFromDatetimeLocal(startLocal) ?? roundToMinute(new Date()))
    : roundToMinute(new Date());
  const endDate = customSchedule
    ? (dateFromDatetimeLocal(endLocal) ??
      addMinutes(startDate, durationMin))
    : addMinutes(startDate, durationMin);

  function openSchedule() {
    const start = roundToMinute(new Date());
    const end = addMinutes(start, durationMin);
    setStartLocal(toDatetimeLocalValue(start));
    setEndLocal(toDatetimeLocalValue(end));
    setCustomSchedule(true);
  }

  function closeSchedule() {
    setCustomSchedule(false);
  }

  function onPickDuration(minutes: number) {
    setDurationMin(minutes);
    if (customSchedule) {
      const start =
        dateFromDatetimeLocal(startLocal) ?? roundToMinute(new Date());
      setEndLocal(toDatetimeLocalValue(addMinutes(start, minutes)));
    }
  }

  function onStartChange(value: string) {
    setStartLocal(value);
    const start = dateFromDatetimeLocal(value);
    if (!start) return;
    const currentEnd = dateFromDatetimeLocal(endLocal);
    // Keep a valid window: if end is missing or not after start, snap to length.
    if (!currentEnd || currentEnd.getTime() <= start.getTime()) {
      setEndLocal(toDatetimeLocalValue(addMinutes(start, durationMin)));
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="startTime" value={startDate.toISOString()} />
      <input type="hidden" name="endTime" value={endDate.toISOString()} />
      <input type="hidden" name="intent" value="create" />

      {state.message && !state.ok ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
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
            disabled={pending}
            placeholder="Meeting name"
            aria-invalid={Boolean(state.fieldErrors?.title)}
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
            defaultValue={defaultParticipants}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.maxParticipants)}
          />
          {state.fieldErrors?.maxParticipants ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.maxParticipants[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Length</p>
        <div className="flex gap-2">
          {durationOptions.map((minutes) => {
            const selected = durationMin === minutes;
            return (
              <button
                key={minutes}
                type="button"
                disabled={pending}
                onClick={() => onPickDuration(minutes)}
                className={cn(
                  "h-9 flex-1 rounded-md border text-sm transition-colors",
                  selected
                    ? "border-brand bg-brand-soft font-medium text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {formatLength(minutes)}
              </button>
            );
          })}
        </div>
      </div>

      {!customSchedule ? (
        <button
          type="button"
          disabled={pending}
          onClick={openSchedule}
          className="text-sm text-brand hover:underline"
        >
          Set date & time
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Schedule
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={closeSchedule}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Use now
            </button>
          </div>
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
              disabled={pending}
              value={startLocal}
              onChange={(event) => onStartChange(event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.startTime)}
            />
            {state.fieldErrors?.startTime ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.startTime[0]}
              </p>
            ) : null}
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
              disabled={pending}
              value={endLocal}
              onChange={(event) => setEndLocal(event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.endTime)}
            />
            {state.fieldErrors?.endTime ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.endTime[0]}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <RoomVisibilityField
        value={visibility}
        onChange={setVisibility}
        disabled={pending}
        error={state.fieldErrors?.visibility?.[0]}
      />

      <AllowedEmailsField
        active={visibility === "private"}
        disabled={pending}
        error={state.fieldErrors?.allowedEmails?.[0]}
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create"}
      </Button>
    </form>
  );
}
