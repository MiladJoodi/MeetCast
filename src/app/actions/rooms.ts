"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { db } from "@/db";
import { roomMembers, rooms, type Room } from "@/db/schema";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { AppError, toSafeClientError } from "@/lib/errors";
import { syncLiveKitRoleForUser } from "@/lib/livekit/moderation";
import {
  assertLiveKitCapacityAvailable,
  deleteLiveKitRoom,
} from "@/lib/livekit/token";
import { logger } from "@/lib/logger";
import {
  assertRoomDurationAllowed,
  getEffectiveMaxRoomDurationMs,
} from "@/lib/plans/limits";
import { getUserPlan } from "@/lib/plans/queries";
import { assertAccountConcurrentCapacity } from "@/lib/plans/usage";
import { requireHost } from "@/lib/rooms/authorization";
import { assertJoinCapacityAvailable } from "@/lib/rooms/capacity";
import {
  assertEmailAllowedForRoom,
  replaceRoomAllowedEmails,
} from "@/lib/rooms/email-allowlist";
import { endRoomNow } from "@/lib/rooms/end-room";
import { createGuestSession } from "@/lib/rooms/guest";
import { generateInviteCode } from "@/lib/rooms/invite";
import { assertCanManageModeratorRole } from "@/lib/rooms/moderation-rules";
import {
  countAuthenticatedMembers,
  getMembership,
  getRoomByInviteCode,
} from "@/lib/rooms/queries";
import {
  assertRoomJoinWindow,
  deriveRoomStatus,
  legacyStatusFromDerived,
} from "@/lib/rooms/schedule";
import {
  createRoomSchemaWithMaxDuration,
  deleteRoomsSchema,
  guestJoinSchema,
  roomIdSchema,
  updateRoomSchemaWithMaxDuration,
} from "@/lib/rooms/validation";
import { assertGuestJoinRateLimit } from "@/lib/security/rate-limit";

export type RoomActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten();
  const fieldErrors = flattened.fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const result: Record<string, string[]> = {};

  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[key] = messages;
    }
  }

  return result;
}

function actionError(error: unknown): RoomActionState {
  const safe = toSafeClientError(error);
  return {
    ok: false,
    message: safe.message,
  };
}

async function rejectIfOutsideJoinWindow(room: Room): Promise<void> {
  const now = new Date();
  try {
    assertRoomJoinWindow(room, now);
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === "FORBIDDEN" &&
      deriveRoomStatus(room, now) === "ended"
    ) {
      if (room.status !== "ended") {
        await db
          .update(rooms)
          .set({ status: "ended" })
          .where(eq(rooms.id, room.id));
      }
      await deleteLiveKitRoom(room.id);
    }
    throw error;
  }
}

export async function createRoomAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const user = await requireUser();
  let roomId: string;

  try {
    const plan = await getUserPlan(user.id);
    const maxDurationMs = getEffectiveMaxRoomDurationMs(plan);
    const parsed = createRoomSchemaWithMaxDuration(maxDurationMs).safeParse({
      title: formString(formData, "title"),
      maxParticipants: formString(formData, "maxParticipants"),
      startTime: formString(formData, "startTime"),
      endTime: formString(formData, "endTime"),
      visibility: formString(formData, "visibility") || "public",
      allowedEmails: formString(formData, "allowedEmails"),
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const {
      title,
      maxParticipants,
      startTime,
      endTime,
      visibility,
      allowedEmails,
    } = parsed.data;
    assertRoomDurationAllowed(plan, startTime, endTime);

    const inviteCode = generateInviteCode();
    const status = legacyStatusFromDerived(
      deriveRoomStatus({ startTime, endTime }),
    );

    const created = await db
      .insert(rooms)
      .values({
        title,
        type: "meeting",
        visibility,
        maxParticipants,
        hostUserId: user.id,
        inviteCode,
        startTime,
        endTime,
        status,
      })
      .returning({ id: rooms.id });

    const room = created[0];
    if (!room) {
      throw new Error("Room insert returned no row");
    }

    await db.insert(roomMembers).values({
      roomId: room.id,
      userId: user.id,
      role: "host",
    });

    await replaceRoomAllowedEmails(room.id, allowedEmails);

    roomId = room.id;
    logger.info("rooms.create_success", {
      roomId: room.id,
      hostUserId: user.id,
      type: "meeting",
      visibility,
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rooms");
  } catch (error) {
    logger.error("rooms.create_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }

  const intent = formString(formData, "intent");
  const joinAfterCreate = intent === "join";

  redirect(joinAfterCreate ? `/room/${roomId}` : "/dashboard/rooms");
}

export async function updateRoomAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const user = await requireUser();

  try {
    const plan = await getUserPlan(user.id);
    const maxDurationMs = getEffectiveMaxRoomDurationMs(plan);
    const parsed = updateRoomSchemaWithMaxDuration(maxDurationMs).safeParse({
      roomId: formString(formData, "roomId"),
      title: formString(formData, "title"),
      maxParticipants: formString(formData, "maxParticipants"),
      startTime: formString(formData, "startTime"),
      endTime: formString(formData, "endTime"),
      visibility: formString(formData, "visibility") || "public",
      allowedEmails: formString(formData, "allowedEmails"),
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const {
      roomId,
      title,
      maxParticipants,
      startTime,
      endTime,
      visibility,
      allowedEmails,
    } = parsed.data;

    const access = await requireHost(roomId);
    const existing = access.room;

    const now = new Date();
    const currentStatus = deriveRoomStatus(existing, now);

    // No meeting extension while live or after end.
    if (
      (currentStatus === "live" || currentStatus === "ended") &&
      endTime.getTime() > existing.endTime.getTime()
    ) {
      throw new AppError(
        "FORBIDDEN",
        "Meeting extension is not available.",
        403,
      );
    }

    if (currentStatus === "ended") {
      throw new AppError(
        "FORBIDDEN",
        "Ended rooms cannot be edited.",
        403,
      );
    }

    assertRoomDurationAllowed(plan, startTime, endTime);

    const status = legacyStatusFromDerived(
      deriveRoomStatus({ startTime, endTime }, now),
    );

    await db
      .update(rooms)
      .set({
        title,
        maxParticipants,
        startTime,
        endTime,
        status,
        visibility,
      })
      .where(eq(rooms.id, roomId));

    await replaceRoomAllowedEmails(roomId, allowedEmails);

    logger.info("rooms.update_success", { roomId, visibility });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${roomId}/edit`);
    revalidatePath(`/room/${roomId}`);
    return { ok: true, message: "Room updated." };
  } catch (error) {
    logger.error("rooms.update_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }
}

export async function deleteRoomAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const parsed = roomIdSchema.safeParse({
    roomId: formString(formData, "roomId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid room.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { roomId } = parsed.data;

  try {
    await requireHost(roomId);
    await deleteLiveKitRoom(roomId);
    await db.delete(rooms).where(eq(rooms.id, roomId));
    logger.info("rooms.delete_success", { roomId });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rooms");
  } catch (error) {
    logger.error("rooms.delete_failed", {
      roomId,
      error: error instanceof Error ? error.name : "unknown",
    });
    return actionError(error);
  }

  redirect("/dashboard/rooms");
}

export async function endRoomAsHostAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const parsed = roomIdSchema.safeParse({
    roomId: formString(formData, "roomId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid room.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { roomId } = parsed.data;

  try {
    const { room } = await requireHost(roomId);
    await endRoomNow(room);
    logger.info("rooms.host_ended", { roomId });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${roomId}/edit`);
    revalidatePath(`/room/${roomId}`);
    return {
      ok: true,
      message: "Meeting ended. Participants will be disconnected.",
    };
  } catch (error) {
    logger.error("rooms.host_end_failed", {
      roomId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }
}

export async function deleteRoomsAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const user = await requireUser();
  const roomIds = formData
    .getAll("roomIds")
    .filter((value): value is string => typeof value === "string");

  const parsed = deleteRoomsSchema.safeParse({ roomIds });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Select at least one valid room.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const ids = parsed.data.roomIds;

  try {
    const owned = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.hostUserId, user.id), inArray(rooms.id, ids)));

    if (owned.length !== ids.length) {
      throw new AppError(
        "FORBIDDEN",
        "You can only delete rooms you host.",
        403,
      );
    }

    await db.delete(rooms).where(inArray(rooms.id, ids));
    await Promise.all(ids.map((id) => deleteLiveKitRoom(id)));
    logger.info("rooms.bulk_delete_success", {
      count: ids.length,
      hostUserId: user.id,
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rooms");
  } catch (error) {
    logger.error("rooms.bulk_delete_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return actionError(error);
  }

  redirect("/dashboard/rooms");
}

export async function joinRoomAsMemberAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const user = await requireUser();
  const inviteCode = formString(formData, "inviteCode").trim();

  if (!inviteCode) {
    return { ok: false, message: "Invite code is required." };
  }

  let roomId: string;

  try {
    const room = await getRoomByInviteCode(inviteCode);
    if (!room) {
      throw new AppError("NOT_FOUND", "Invite link is invalid.", 404);
    }

    await rejectIfOutsideJoinWindow(room);

    roomId = room.id;

    await assertEmailAllowedForRoom({
      roomId: room.id,
      hostUserId: room.hostUserId,
      visibility: room.visibility,
      actorUserId: user.id,
      email: user.email,
    });

    if (room.hostUserId !== user.id) {
      const existing = await getMembership(room.id, user.id);
      if (!existing) {
        await assertAccountConcurrentCapacity({
          hostUserId: room.hostUserId,
        });
        await assertLiveKitCapacityAvailable(room);

        try {
          // Soft capacity: neon-http has no transactions/FOR UPDATE.
          // Unique (roomId, userId) still serializes duplicate joins.
          const memberCount = await countAuthenticatedMembers(room.id);
          await assertJoinCapacityAvailable(room, memberCount);

          await db.insert(roomMembers).values({
            roomId: room.id,
            userId: user.id,
            role: "participant",
          });

          logger.info("rooms.member_join_success", {
            roomId: room.id,
            userId: user.id,
          });
        } catch (error) {
          if (!isUniqueViolation(error)) {
            throw error;
          }
          // Concurrent duplicate join — already a member.
        }
      }
    }
  } catch (error) {
    logger.error("rooms.member_join_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }

  redirect(`/room/${roomId}`);
}

export async function joinRoomAsGuestAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const existingUser = await getCurrentUser();
  if (existingUser) {
    return {
      ok: false,
      message: "You are signed in. Use Join as a participant instead.",
    };
  }

  const parsed = guestJoinSchema.safeParse({
    inviteCode: formString(formData, "inviteCode"),
    displayName: formString(formData, "displayName"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { inviteCode, displayName } = parsed.data;
  let roomId: string;

  try {
    await assertGuestJoinRateLimit();

    const room = await getRoomByInviteCode(inviteCode);
    if (!room) {
      throw new AppError("NOT_FOUND", "Invite link is invalid.", 404);
    }

    if (room.visibility === "private") {
      throw new AppError(
        "FORBIDDEN",
        "This is a private meeting. Sign in with an invited account to continue.",
        403,
      );
    }

    await rejectIfOutsideJoinWindow(room);

    await assertAccountConcurrentCapacity({
      hostUserId: room.hostUserId,
    });
    const memberCount = await countAuthenticatedMembers(room.id);
    await assertJoinCapacityAvailable(room, memberCount);
    await assertLiveKitCapacityAvailable(room);

    await createGuestSession({
      roomId: room.id,
      displayName,
      roomEndTime: room.endTime,
    });

    roomId = room.id;
    logger.info("rooms.guest_join_success", { roomId: room.id });
  } catch (error) {
    logger.error("rooms.guest_join_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return actionError(error);
  }

  redirect(`/room/${roomId}`);
}

export async function regenerateInviteAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const parsed = roomIdSchema.safeParse({
    roomId: formString(formData, "roomId"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid room." };
  }

  const { roomId } = parsed.data;

  try {
    await requireHost(roomId);
    const inviteCode = generateInviteCode();

    await db.update(rooms).set({ inviteCode }).where(eq(rooms.id, roomId));

    logger.info("rooms.invite_regenerated", { roomId });
    revalidatePath(`/dashboard/rooms/${roomId}/edit`);
    revalidatePath(`/room/${roomId}`);
    return { ok: true, message: "Invite link regenerated." };
  } catch (error) {
    logger.error("rooms.invite_regenerate_failed", {
      roomId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }
}

export async function setMemberRoleAction(
  _prevState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const roomId = formString(formData, "roomId");
  const userId = formString(formData, "userId");
  const role = formString(formData, "role");

  if (role !== "moderator" && role !== "participant") {
    return { ok: false, message: "Invalid role." };
  }

  try {
    const access = await requireHost(roomId);
    if (access.actor.kind !== "user") {
      throw new AppError("FORBIDDEN", "Only the room host can manage roles.", 403);
    }

    if (userId === access.actor.user.id) {
      throw new AppError(
        "FORBIDDEN",
        "You cannot change your own role this way.",
        403,
      );
    }

    assertCanManageModeratorRole(access.actor);

    if (userId === access.room.hostUserId) {
      throw new AppError(
        "FORBIDDEN",
        "Cannot change the host's membership role this way.",
        403,
      );
    }

    const membership = await getMembership(roomId, userId);
    if (!membership) {
      throw new AppError("NOT_FOUND", "Member not found in this room.", 404);
    }

    if (membership.role === "host") {
      throw new AppError(
        "FORBIDDEN",
        "Cannot change the host's membership role this way.",
        403,
      );
    }

    await db
      .update(roomMembers)
      .set({ role })
      .where(
        and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
      );

    await syncLiveKitRoleForUser({
      room: access.room,
      userId,
      role,
    });

    logger.info("rooms.member_role_updated", { roomId, userId, role });
    return { ok: true, message: "Member role updated." };
  } catch (error) {
    logger.error("rooms.member_role_failed", {
      roomId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return actionError(error);
  }
}
