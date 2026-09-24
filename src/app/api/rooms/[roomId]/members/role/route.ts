import { z } from "zod";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { roomMembers } from "@/db/schema";
import { AppError, jsonError } from "@/lib/errors";
import { syncLiveKitRoleForUser } from "@/lib/livekit/moderation";
import { logger } from "@/lib/logger";
import { requireHost } from "@/lib/rooms/authorization";
import { assertCanManageModeratorRole } from "@/lib/rooms/moderation-auth";
import { getMembership } from "@/lib/rooms/queries";
import { assertSameOrigin } from "@/lib/security/same-origin";

const bodySchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["moderator", "participant"]),
});

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * POST /api/rooms/[roomId]/members/role
 * Host-only promote/demote. Persists to PostgreSQL; syncs LiveKit metadata if online.
 */
export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;

  try {
    assertSameOrigin(request);

    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid role update.",
          },
        },
        { status: 400 },
      );
    }

    const access = await requireHost(roomId);
    assertCanManageModeratorRole(access.actor);

    const { userId, role } = parsed.data;

    if (userId === access.room.hostUserId) {
      throw new AppError(
        "FORBIDDEN",
        "Cannot change the host's membership role this way.",
        403,
      );
    }

    if (access.actor.kind === "user" && userId === access.actor.user.id) {
      throw new AppError(
        "FORBIDDEN",
        "You cannot change your own role.",
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
        "Cannot change the host membership role.",
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

    return Response.json({
      ok: true,
      role,
      message:
        role === "moderator"
          ? "Participant promoted to moderator."
          : "Moderator demoted to participant.",
    });
  } catch (error) {
    logger.error("rooms.member_role_route_failed", {
      roomId,
      error: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(error);
  }
}
