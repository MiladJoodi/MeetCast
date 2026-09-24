import { z } from "zod";

import { jsonError } from "@/lib/errors";
import { issueLiveKitTokenForRoom } from "@/lib/livekit/issue-token";
import { logger } from "@/lib/logger";
import { assertLiveKitTokenRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/same-origin";

const bodySchema = z.object({
  roomId: z.string().uuid("Invalid room."),
});

/**
 * POST /api/livekit/token
 * Body: { roomId }
 * Returns short-lived LiveKit JWT after application authorization.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertLiveKitTokenRateLimit();

    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request.",
          },
        },
        { status: 400 },
      );
    }

    const result = await issueLiveKitTokenForRoom(parsed.data.roomId);

    return Response.json({
      token: result.token,
      livekitUrl: result.livekitUrl,
      roomName: result.roomName,
      identity: result.identity,
      displayName: result.displayName,
      role: result.role,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    logger.error("livekit.token_route_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return jsonError(error);
  }
}
