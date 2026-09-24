import type { RoomAccessActor } from "@/lib/rooms/actors";

/**
 * Stable LiveKit participant identities.
 * - Users: opaque user UUID prefix (not email/password)
 * - Guests: room-scoped random guestId from the signed guest cookie
 */
export function toLiveKitIdentity(actor: RoomAccessActor): string {
  if (actor.kind === "guest") {
    return `guest:${actor.guest.roomId}:${actor.guest.guestId}`;
  }
  return `user:${actor.user.id}`;
}

export function toLiveKitDisplayName(actor: RoomAccessActor): string {
  if (actor.kind === "guest") {
    return actor.guest.displayName;
  }
  return actor.user.name;
}

export type LiveKitAppRole = "host" | "moderator" | "participant" | "guest";

export function toAppRole(actor: RoomAccessActor): LiveKitAppRole {
  return actor.role;
}
