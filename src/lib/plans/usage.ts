import "server-only";

import { and, eq, gt, lte } from "drizzle-orm";

import { db } from "@/db";
import { rooms, type Plan, type Room } from "@/db/schema";
import {
  getLiveKitParticipantCount,
} from "@/lib/livekit/token";
import { createRoomServiceClient } from "@/lib/livekit/room-service";
import { toLiveKitRoomName } from "@/lib/livekit/room-name";
import { logger } from "@/lib/logger";
import { assertConcurrentWithinLimit } from "@/lib/plans/limits";
import { getUserPlan } from "@/lib/plans/queries";

export type RoomUsageRow = {
  roomId: string;
  title: string;
  occupants: number;
};

export type AccountConcurrentUsage = {
  used: number;
  limit: number;
  plan: Plan;
  byRoom: RoomUsageRow[];
};

export async function listLiveHostedRooms(
  hostUserId: string,
  now: Date = new Date(),
): Promise<Room[]> {
  return db
    .select()
    .from(rooms)
    .where(
      and(
        eq(rooms.hostUserId, hostUserId),
        lte(rooms.startTime, now),
        gt(rooms.endTime, now),
      ),
    );
}

/**
 * Sum LiveKit occupants across the host's schedule-live rooms.
 * Failed LiveKit queries count as 0 for that room (logged).
 * Pass `plan` when already loaded to avoid a duplicate getUserPlan.
 */
export async function getAccountConcurrentUsage(
  hostUserId: string,
  options?: { plan?: Plan },
): Promise<AccountConcurrentUsage> {
  const plan = options?.plan ?? (await getUserPlan(hostUserId));
  const liveRooms = await listLiveHostedRooms(hostUserId);

  const byRoom: RoomUsageRow[] = await Promise.all(
    liveRooms.map(async (room) => {
      let occupants = 0;
      try {
        occupants = await getLiveKitParticipantCount(room.id);
      } catch (error) {
        logger.warn("plans.usage_livekit_failed", {
          roomId: room.id,
          error: error instanceof Error ? error.name : "unknown",
        });
      }
      return {
        roomId: room.id,
        title: room.title,
        occupants,
      };
    }),
  );

  const used = byRoom.reduce((sum, row) => sum + row.occupants, 0);

  return {
    used,
    limit: plan.maxConcurrentParticipants,
    plan,
    byRoom,
  };
}

async function isIdentityInRoom(
  applicationRoomId: string,
  identity: string,
): Promise<boolean> {
  try {
    const roomService = createRoomServiceClient();
    const participants = await roomService.listParticipants(
      toLiveKitRoomName(applicationRoomId),
    );
    return participants.some((p) => p.identity === identity);
  } catch {
    return false;
  }
}

/**
 * Enforce account-wide concurrent participant limit for a room host.
 *
 * Soft TOCTOU remains vs LiveKit multi-room occupancy (same class as Phase 1
 * soft capacity). Prefer calling this before minting a new seat.
 */
export async function assertAccountConcurrentCapacity(input: {
  hostUserId: string;
  roomId?: string;
  identity?: string;
}): Promise<void> {
  const usage = await getAccountConcurrentUsage(input.hostUserId);

  let joining = 1;
  if (input.roomId && input.identity) {
    const already = await isIdentityInRoom(input.roomId, input.identity);
    joining = already ? 0 : 1;
  }

  assertConcurrentWithinLimit({
    used: usage.used,
    limit: usage.limit,
    joining,
  });
}
