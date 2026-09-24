import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { roomMembers } from "@/db/schema";
import { jsonError } from "@/lib/errors";
import { toLiveKitIdentity } from "@/lib/livekit/identity";
import {
  disableParticipantCamera,
  muteParticipantMicrophone,
  removeLiveKitParticipant,
} from "@/lib/livekit/moderation";
import { parseLiveKitIdentity } from "@/lib/livekit/parse-identity";
import { logger } from "@/lib/logger";
import { requireModeratorOrHost } from "@/lib/rooms/authorization";
import { revokeGuestAccess } from "@/lib/rooms/guest-revoke";
import {
  assertCanModerateTarget,
  resolveTargetAppRole,
} from "@/lib/rooms/moderation-auth";
import { assertSameOrigin } from "@/lib/security/same-origin";

const bodySchema = z.object({
  action: z.enum(["mute", "disable_camera", "remove"]),
  targetIdentity: z.string().min(1).max(200),
});

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * POST /api/rooms/[roomId]/moderate
 * Host/moderator LiveKit moderation — authorized via application membership.
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
            message: "Invalid moderation request.",
          },
        },
        { status: 400 },
      );
    }

    const access = await requireModeratorOrHost(roomId);
    const { room, actor } = access;
    const actorIdentity = toLiveKitIdentity(actor);
    const { action, targetIdentity } = parsed.data;

    const { role: targetRole } = await resolveTargetAppRole(
      room,
      targetIdentity,
    );

    assertCanModerateTarget({
      actor,
      targetRole,
      targetIdentity,
      actorIdentity,
    });

    if (action === "mute") {
      const result = await muteParticipantMicrophone({
        room,
        targetIdentity,
      });
      logger.info("moderation.mute", { roomId: room.id, action });
      return Response.json({
        ok: true,
        action,
        alreadyMuted: result.alreadyMuted,
        mutedTrackCount: result.mutedTrackCount,
        message: result.alreadyMuted
          ? "Participant microphone was already muted."
          : "Participant microphone muted.",
      });
    }

    if (action === "disable_camera") {
      const result = await disableParticipantCamera({
        room,
        targetIdentity,
      });
      logger.info("moderation.disable_camera", { roomId: room.id });
      return Response.json({
        ok: true,
        action,
        alreadyOff: result.alreadyOff,
        disabledTrackCount: result.disabledTrackCount,
        message: result.alreadyOff
          ? "Participant camera was already off."
          : "Participant camera disabled.",
      });
    }

    await removeLiveKitParticipant({ room, targetIdentity });

    // Revoke application access so refresh cannot mint a new token.
    const parsedId = parseLiveKitIdentity(targetIdentity);
    if (parsedId?.kind === "user") {
      await db
        .delete(roomMembers)
        .where(
          and(
            eq(roomMembers.roomId, room.id),
            eq(roomMembers.userId, parsedId.userId),
          ),
        );
    } else if (parsedId?.kind === "guest" && parsedId.roomId === room.id) {
      await revokeGuestAccess({
        roomId: room.id,
        guestId: parsedId.guestId,
      });
    }

    logger.info("moderation.remove", { roomId: room.id });
    return Response.json({
      ok: true,
      action: "remove",
      message: "Participant removed from the meeting.",
    });
  } catch (error) {
    logger.error("moderation.route_failed", {
      roomId,
      error: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(error);
  }
}
