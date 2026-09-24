import type { Plan } from "@/db/schema";
import { AppError } from "@/lib/errors";
import {
  DEFAULT_MAX_ROOM_DURATION_MS,
  MIN_ROOM_DURATION_MS,
} from "@/lib/rooms/constants";

/**
 * Effective max meeting duration for a plan.
 * Null plan minutes = unlimited within the technical platform ceiling.
 */
export function getEffectiveMaxRoomDurationMs(plan: Plan): number {
  if (
    plan.maxRoomDurationMinutes === null ||
    plan.maxRoomDurationMinutes === undefined
  ) {
    return DEFAULT_MAX_ROOM_DURATION_MS;
  }
  const planMs = plan.maxRoomDurationMinutes * 60_000;
  return Math.min(DEFAULT_MAX_ROOM_DURATION_MS, planMs);
}

export function formatPlanDurationLabel(plan: Plan): string {
  if (
    plan.maxRoomDurationMinutes === null ||
    plan.maxRoomDurationMinutes === undefined
  ) {
    return `Unlimited (up to ${DEFAULT_MAX_ROOM_DURATION_MS / 60_000} minutes technical max)`;
  }
  return `${plan.maxRoomDurationMinutes} minutes`;
}

export function assertRoomDurationAllowed(
  plan: Plan,
  startTime: Date,
  endTime: Date,
): void {
  const duration = endTime.getTime() - startTime.getTime();
  if (duration <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "End time must be after start time.",
      400,
    );
  }
  if (duration < MIN_ROOM_DURATION_MS) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Meeting must be at least ${MIN_ROOM_DURATION_MS / 60_000} minutes.`,
      400,
    );
  }
  const maxDuration = getEffectiveMaxRoomDurationMs(plan);
  if (duration > maxDuration) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Your ${plan.name} plan allows meetings up to ${maxDuration / 60_000} minutes.`,
      400,
    );
  }
}

/** Pure occupancy gate for unit tests. */
export function assertConcurrentWithinLimit(input: {
  used: number;
  limit: number;
  joining?: number;
}): void {
  const joining = input.joining ?? 1;
  if (input.used + joining > input.limit) {
    throw new AppError(
      "ROOM_FULL",
      "This account has reached its concurrent participant limit for the current plan.",
      409,
    );
  }
}

export function assertPlanCanBeAssigned(plan: Plan): void {
  if (!plan.isActive) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Only active plans can be assigned.",
      400,
    );
  }
}

export function assertPlanCanBeDeleted(assignedUserCount: number): void {
  if (assignedUserCount > 0) {
    throw new AppError(
      "CONFLICT",
      "Cannot delete a plan that is assigned to users.",
      409,
    );
  }
}
