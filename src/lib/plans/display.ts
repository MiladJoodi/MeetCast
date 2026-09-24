import type { Plan } from "@/db/schema";
import { DEFAULT_MAX_ROOM_DURATION_MS } from "@/lib/rooms/constants";

/** User-facing duration label for comparison tables. */
export function formatPlanDurationDisplay(plan: Plan): string {
  if (
    plan.maxRoomDurationMinutes === null ||
    plan.maxRoomDurationMinutes === undefined
  ) {
    return "Unlimited";
  }
  return `${plan.maxRoomDurationMinutes} minutes`;
}

/** Optional note under Unlimited duration (technical ceiling). */
export function formatPlanDurationNote(plan: Plan): string | null {
  if (
    plan.maxRoomDurationMinutes === null ||
    plan.maxRoomDurationMinutes === undefined
  ) {
    return `Up to ${DEFAULT_MAX_ROOM_DURATION_MS / 60_000} minutes technical max`;
  }
  return null;
}

export function isCurrentUserPlan(
  plan: Plan,
  currentPlanId: string | null | undefined,
): boolean {
  return Boolean(currentPlanId) && plan.id === currentPlanId;
}

/** Active plans only, ordered for display (lowest concurrent first). */
export function sortPlansForDisplay(plans: Plan[]): Plan[] {
  return [...plans]
    .filter((plan) => plan.isActive)
    .sort(
      (a, b) =>
        a.maxConcurrentParticipants - b.maxConcurrentParticipants ||
        a.name.localeCompare(b.name),
    );
}

export type PlanComparisonRow = {
  feature: string;
  /** One cell per plan, same order as the input plans array. */
  values: string[];
  group?: "Meetings" | "Collaboration" | "Access";
};

/**
 * Build a side-by-side comparison matrix for active plans.
 * Do not invent per-plan restrictions that are not in the database.
 */
export function buildPlanComparisonRows(plans: Plan[]): PlanComparisonRow[] {
  if (plans.length === 0) {
    return [];
  }

  const allYes = plans.map(() => "✓");
  const unlimitedRooms = plans.map(() => "Unlimited");

  return [
    {
      group: "Meetings",
      feature: "Number of rooms",
      values: unlimitedRooms,
    },
    {
      group: "Meetings",
      feature: "Maximum concurrent participants",
      values: plans.map(
        (plan) => `${plan.maxConcurrentParticipants} participants`,
      ),
    },
    {
      group: "Meetings",
      feature: "Maximum room duration",
      values: plans.map((plan) => {
        if (
          plan.maxRoomDurationMinutes === null ||
          plan.maxRoomDurationMinutes === undefined
        ) {
          return "Unlimited";
        }
        return `${plan.maxRoomDurationMinutes} minutes`;
      }),
    },
    { group: "Collaboration", feature: "Camera", values: allYes },
    { group: "Collaboration", feature: "Microphone", values: allYes },
    { group: "Collaboration", feature: "Screen sharing", values: allYes },
    { group: "Collaboration", feature: "Chat", values: allYes },
    { group: "Collaboration", feature: "Reactions", values: allYes },
    { group: "Collaboration", feature: "Raise hand", values: allYes },
    { group: "Access", feature: "Guest join", values: allYes },
    { group: "Access", feature: "Invite links", values: allYes },
    { group: "Access", feature: "Scheduled meetings", values: allYes },
    { group: "Access", feature: "Moderation", values: allYes },
  ];
}
