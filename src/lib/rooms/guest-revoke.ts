import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { revokedGuests } from "@/db/schema";

/** Persist a guest kick so their cookie cannot mint a new token after refresh. */
export async function revokeGuestAccess(input: {
  roomId: string;
  guestId: string;
}): Promise<void> {
  await db
    .insert(revokedGuests)
    .values({
      roomId: input.roomId,
      guestId: input.guestId,
    })
    .onConflictDoNothing({
      target: [revokedGuests.roomId, revokedGuests.guestId],
    });
}

export async function isGuestRevoked(input: {
  roomId: string;
  guestId: string;
}): Promise<boolean> {
  const row = await db.query.revokedGuests.findFirst({
    where: and(
      eq(revokedGuests.roomId, input.roomId),
      eq(revokedGuests.guestId, input.guestId),
    ),
    columns: { id: true },
  });
  return Boolean(row);
}
