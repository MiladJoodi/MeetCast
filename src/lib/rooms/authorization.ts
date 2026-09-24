import "server-only";

import type { Room } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  isHost,
  isModeratorOrHost,
  type RoomAccessActor,
} from "@/lib/rooms/actors";
import { getGuestSessionForRoom } from "@/lib/rooms/guest";
import { isEmailAllowedForRoom } from "@/lib/rooms/email-allowlist";
import {
  getMembership,
  requireRoomRecord,
} from "@/lib/rooms/queries";

export type { RoomAccessActor } from "@/lib/rooms/actors";
export { isHost, isModeratorOrHost } from "@/lib/rooms/actors";

export type RoomAccess = {
  room: Room;
  actor: RoomAccessActor;
};

export async function resolveRoomAccess(
  roomId: string,
): Promise<RoomAccess | null> {
  const room = await requireRoomRecord(roomId).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      return null;
    }
    throw error;
  });

  if (!room) {
    return null;
  }

  const user = await getCurrentUser();

  if (user) {
    // Host ownership is authoritative even if membership row is missing.
    if (room.hostUserId === user.id) {
      return {
        room,
        actor: { kind: "user", user, role: "host" },
      };
    }

    const membership = await getMembership(room.id, user.id);
    if (membership) {
      const allowed = await isEmailAllowedForRoom({
        roomId: room.id,
        hostUserId: room.hostUserId,
        visibility: room.visibility,
        actorUserId: user.id,
        email: user.email,
      });
      if (!allowed) {
        return null;
      }
      return {
        room,
        actor: { kind: "user", user, role: membership.role },
      };
    }

    // Private rooms: authenticated but not yet a member — still no guest fallback.
    if (room.visibility === "private") {
      return null;
    }
  }

  // Private rooms never allow anonymous guests.
  if (room.visibility === "private") {
    return null;
  }

  const guest = await getGuestSessionForRoom(room.id);
  if (guest) {
    return {
      room,
      actor: { kind: "guest", guest, role: "guest" },
    };
  }

  return null;
}

export async function requireRoomAccess(roomId: string): Promise<RoomAccess> {
  const access = await resolveRoomAccess(roomId);
  if (!access) {
    logger.warn("rooms.access_denied", { roomId });
    throw new AppError(
      "FORBIDDEN",
      "You do not have access to this room.",
      403,
    );
  }
  return access;
}

export async function requireHost(roomId: string): Promise<RoomAccess> {
  const access = await requireRoomAccess(roomId);
  if (!isHost(access.actor)) {
    logger.warn("rooms.host_required", { roomId });
    throw new AppError(
      "FORBIDDEN",
      "Only the room host can perform this action.",
      403,
    );
  }
  return access;
}

export async function requireModeratorOrHost(
  roomId: string,
): Promise<RoomAccess> {
  const access = await requireRoomAccess(roomId);
  if (!isModeratorOrHost(access.actor)) {
    logger.warn("rooms.moderator_required", { roomId });
    throw new AppError(
      "FORBIDDEN",
      "Only a host or moderator can perform this action.",
      403,
    );
  }
  return access;
}
