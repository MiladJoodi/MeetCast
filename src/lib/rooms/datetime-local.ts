/** Client-safe datetime-local helpers (no AppError / server deps). */

/** `datetime-local` value in the user's local timezone. */
export function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/**
 * Parse a `datetime-local` string as a local Date (avoids UTC/local ambiguity
 * of `new Date("YYYY-MM-DDTHH:mm")`).
 */
export function dateFromDatetimeLocal(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
    0,
  );
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Parse a `datetime-local` string as a local Date, return ISO UTC. */
export function isoFromDatetimeLocal(value: string): string {
  const date = dateFromDatetimeLocal(value);
  if (!date) return "";
  return date.toISOString();
}
