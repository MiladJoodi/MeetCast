import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { roomAllowedEmails, type RoomVisibility } from "@/db/schema";
import { normalizeEmail } from "@/lib/auth/validation";
import { AppError } from "@/lib/errors";
import { isActorAllowedByVisibility } from "@/lib/rooms/visibility-access";

export async function listAllowedEmailsForRoom(
  roomId: string,
): Promise<string[]> {
  const rows = await db
    .select({ email: roomAllowedEmails.email })
    .from(roomAllowedEmails)
    .where(eq(roomAllowedEmails.roomId, roomId))
    .orderBy(asc(roomAllowedEmails.email));

  return rows.map((row) => row.email);
}

export async function roomHasEmailAllowlist(roomId: string): Promise<boolean> {
  const rows = await db
    .select({ id: roomAllowedEmails.id })
    .from(roomAllowedEmails)
    .where(eq(roomAllowedEmails.roomId, roomId))
    .limit(1);
  return Boolean(rows[0]);
}

/**
 * Replace the room allowlist. Empty clears rows.
 * List may be kept while visibility is public (not enforced until private).
 */
export async function replaceRoomAllowedEmails(
  roomId: string,
  emails: string[],
): Promise<void> {
  const unique = [
    ...new Set(emails.map((email) => normalizeEmail(email))),
  ].filter(Boolean);

  await db
    .delete(roomAllowedEmails)
    .where(eq(roomAllowedEmails.roomId, roomId));

  if (unique.length === 0) {
    return;
  }

  await db.insert(roomAllowedEmails).values(
    unique.map((email) => ({
      roomId,
      email,
    })),
  );
}

/**
 * Public → anyone (invite/schedule still apply elsewhere).
 * Private → host always; else authenticated email must be on allowlist.
 * Guests never pass private checks (no session email from DB account).
 */
export async function isEmailAllowedForRoom(input: {
  roomId: string;
  hostUserId: string;
  visibility: RoomVisibility;
  actorUserId?: string | null;
  email?: string | null;
}): Promise<boolean> {
  if (input.visibility === "public") {
    return true;
  }

  const allowedEmails = await listAllowedEmailsForRoom(input.roomId);
  return isActorAllowedByVisibility({
    visibility: input.visibility,
    hostUserId: input.hostUserId,
    actorUserId: input.actorUserId,
    email: input.email,
    allowedEmails,
  });
}

export async function assertEmailAllowedForRoom(input: {
  roomId: string;
  hostUserId: string;
  visibility: RoomVisibility;
  actorUserId?: string | null;
  email?: string | null;
}): Promise<void> {
  if (input.visibility === "private" && !input.actorUserId) {
    throw new AppError(
      "FORBIDDEN",
      "This is a private meeting. Sign in with an invited account to continue.",
      403,
    );
  }

  const ok = await isEmailAllowedForRoom(input);
  if (!ok) {
    throw new AppError(
      "FORBIDDEN",
      "You don't have access to this meeting. This is a private meeting and your account isn't on the guest list.",
      403,
    );
  }
}
