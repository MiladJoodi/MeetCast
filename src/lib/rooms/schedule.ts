import { AppError } from "@/lib/errors";
import { ROOM_END_WARNING_MS } from "@/lib/rooms/constants";

/** Derived lifecycle status — source of truth is start/end timestamps. */
export type DerivedRoomStatus = "scheduled" | "live" | "ended";

export type RoomSchedule = {
  startTime: Date;
  endTime: Date;
};

/**
 * Derive room status from the schedule window.
 *
 * Boundaries:
 * - now < startTime → scheduled
 * - startTime <= now < endTime → live
 * - now >= endTime → ended
 */
export function deriveRoomStatus(
  schedule: RoomSchedule,
  now: Date = new Date(),
): DerivedRoomStatus {
  const t = now.getTime();
  const start = schedule.startTime.getTime();
  const end = schedule.endTime.getTime();

  if (t < start) {
    return "scheduled";
  }
  if (t < end) {
    return "live";
  }
  return "ended";
}

export function roomStatusLabel(status: DerivedRoomStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "live":
      return "Live";
    case "ended":
      return "Ended";
  }
}

/** Map derived status onto the legacy DB enum (waiting/active/ended). */
export function legacyStatusFromDerived(
  status: DerivedRoomStatus,
): "waiting" | "active" | "ended" {
  switch (status) {
    case "scheduled":
      return "waiting";
    case "live":
      return "active";
    case "ended":
      return "ended";
  }
}

/**
 * Server-side join / token gate.
 * Before start → reject. At or after end → reject.
 */
export function assertRoomJoinWindow(
  schedule: RoomSchedule,
  now: Date = new Date(),
): DerivedRoomStatus {
  const status = deriveRoomStatus(schedule, now);

  if (status === "scheduled") {
    throw new AppError(
      "FORBIDDEN",
      "This room has not started yet.",
      403,
    );
  }

  if (status === "ended") {
    throw new AppError("FORBIDDEN", "This room has ended.", 403);
  }

  return status;
}

/** Which warning thresholds apply for this meeting length. */
export function applicableEndWarningsMs(
  schedule: RoomSchedule,
): number[] {
  const duration = schedule.endTime.getTime() - schedule.startTime.getTime();
  return ROOM_END_WARNING_MS.filter((ms) => duration > ms);
}

/** Format an instant for list UI (local timezone of the runtime). */
export function formatRoomInstant(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export {
  isoFromDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/rooms/datetime-local";
