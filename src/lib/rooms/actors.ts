import type { MemberRole, PublicUser } from "@/db/schema";
import type { GuestSession } from "@/lib/rooms/guest-types";

export type RoomAccessActor =
  | {
      kind: "user";
      user: PublicUser;
      role: MemberRole;
    }
  | {
      kind: "guest";
      guest: GuestSession;
      role: "guest";
    };

export function isHost(actor: RoomAccessActor): boolean {
  return actor.kind === "user" && actor.role === "host";
}

export function isModeratorOrHost(actor: RoomAccessActor): boolean {
  return (
    actor.kind === "user" &&
    (actor.role === "host" || actor.role === "moderator")
  );
}
