import type { RoomVisibility } from "@/db/schema";
import { normalizeEmail } from "@/lib/auth/validation";

/**
 * Pure visibility + allowlist decision (no DB).
 * Public always allows. Private: host always; else email must be on the list.
 */
export function isActorAllowedByVisibility(input: {
  visibility: RoomVisibility;
  hostUserId: string;
  actorUserId?: string | null;
  email?: string | null;
  allowedEmails: string[];
}): boolean {
  if (input.visibility === "public") {
    return true;
  }

  if (input.actorUserId && input.actorUserId === input.hostUserId) {
    return true;
  }

  const email = input.email ? normalizeEmail(input.email) : "";
  if (!email) {
    return false;
  }

  const allowed = input.allowedEmails.map((item) => normalizeEmail(item));
  return allowed.includes(email);
}

/** Guests may only join public rooms. */
export function canGuestJoinByVisibility(visibility: RoomVisibility): boolean {
  return visibility === "public";
}
