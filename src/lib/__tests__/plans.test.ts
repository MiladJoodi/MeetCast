import { describe, expect, it } from "vitest";

import type { Plan } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { sanitizeAuditMetadata } from "@/lib/admin/audit-sanitize";
import {
  assertConcurrentWithinLimit,
  assertPlanCanBeAssigned,
  assertPlanCanBeDeleted,
  assertRoomDurationAllowed,
  getEffectiveMaxRoomDurationMs,
} from "@/lib/plans/limits";
import {
  formatPlanDurationDisplay,
  isCurrentUserPlan,
  sortPlansForDisplay,
  buildPlanComparisonRows,
} from "@/lib/plans/display";
import { createPlanSchema } from "@/lib/plans/validation";
import { DEFAULT_MAX_ROOM_DURATION_MS } from "@/lib/rooms/constants";

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Free",
    slug: "free",
    description: null,
    maxConcurrentParticipants: 5,
    maxRoomDurationMinutes: 60,
    priceAmount: 0,
    currency: "IRR",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("getEffectiveMaxRoomDurationMs", () => {
  it("caps Free/Starter/Pro to plan minutes", () => {
    expect(getEffectiveMaxRoomDurationMs(makePlan({ maxRoomDurationMinutes: 60 }))).toBe(
      60 * 60_000,
    );
    expect(
      getEffectiveMaxRoomDurationMs(
        makePlan({ name: "Starter", slug: "starter", maxRoomDurationMinutes: 120 }),
      ),
    ).toBe(120 * 60_000);
    expect(
      getEffectiveMaxRoomDurationMs(
        makePlan({ name: "Pro", slug: "pro", maxRoomDurationMinutes: 240 }),
      ),
    ).toBe(240 * 60_000);
  });

  it("uses technical max when plan duration is unlimited (null)", () => {
    expect(
      getEffectiveMaxRoomDurationMs(
        makePlan({
          name: "Business",
          slug: "business",
          maxRoomDurationMinutes: null,
          maxConcurrentParticipants: 50,
        }),
      ),
    ).toBe(DEFAULT_MAX_ROOM_DURATION_MS);
  });
});

describe("assertRoomDurationAllowed", () => {
  const start = new Date("2026-06-01T10:00:00.000Z");

  it("allows durations within Free plan", () => {
    const end = new Date(start.getTime() + 60 * 60_000);
    expect(() =>
      assertRoomDurationAllowed(makePlan(), start, end),
    ).not.toThrow();
  });

  it("rejects durations over plan max", () => {
    const end = new Date(start.getTime() + 61 * 60_000);
    expect(() => assertRoomDurationAllowed(makePlan(), start, end)).toThrow(
      AppError,
    );
  });

  it("rejects edits that exceed plan max", () => {
    const plan = makePlan({ maxRoomDurationMinutes: 120 });
    const end = new Date(start.getTime() + 180 * 60_000);
    expect(() => assertRoomDurationAllowed(plan, start, end)).toThrow(
      /120 minutes/,
    );
  });
});

describe("assertConcurrentWithinLimit", () => {
  it("allows joins within limit", () => {
    expect(() =>
      assertConcurrentWithinLimit({ used: 4, limit: 5, joining: 1 }),
    ).not.toThrow();
  });

  it("rejects when occupancy would exceed limit", () => {
    expect(() =>
      assertConcurrentWithinLimit({ used: 5, limit: 5, joining: 1 }),
    ).toThrow(AppError);
  });

  it("treats already-present identity as zero joining delta", () => {
    expect(() =>
      assertConcurrentWithinLimit({ used: 5, limit: 5, joining: 0 }),
    ).not.toThrow();
  });
});

describe("admin plan policy", () => {
  it("blocks assigning inactive plans", () => {
    expect(() =>
      assertPlanCanBeAssigned(makePlan({ isActive: false })),
    ).toThrow(/active plans/);
  });

  it("blocks delete when users are assigned", () => {
    expect(() => assertPlanCanBeDeleted(3)).toThrow(/assigned to users/);
  });

  it("allows delete when unassigned", () => {
    expect(() => assertPlanCanBeDeleted(0)).not.toThrow();
  });

  it("rejects invalid slug and values", () => {
    const badSlug = createPlanSchema.safeParse({
      name: "Test",
      slug: "Bad Slug!",
      description: "",
      maxConcurrentParticipants: "10",
      maxRoomDurationMinutes: "60",
      isActive: "true",
    });
    expect(badSlug.success).toBe(false);

    const badDuration = createPlanSchema.safeParse({
      name: "Test",
      slug: "test-plan",
      description: "",
      maxConcurrentParticipants: "10",
      maxRoomDurationMinutes: "3",
      priceAmount: "0",
      currency: "IRR",
      isActive: "true",
    });
    expect(badDuration.success).toBe(false);

    const ok = createPlanSchema.safeParse({
      name: "Test",
      slug: "test-plan",
      description: "",
      maxConcurrentParticipants: "10",
      maxRoomDurationMinutes: "",
      priceAmount: "490000",
      currency: "IRR",
      isActive: "true",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.maxRoomDurationMinutes).toBeNull();
      expect(ok.data.priceAmount).toBe(490000);
      expect(ok.data.currency).toBe("IRR");
    }
  });
});

describe("plans page display helpers", () => {
  it("excludes inactive plans from display list", () => {
    const listed = sortPlansForDisplay([
      makePlan({
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Hidden",
        slug: "hidden",
        isActive: false,
        maxConcurrentParticipants: 99,
      }),
      makePlan({ name: "Free", slug: "free", maxConcurrentParticipants: 5 }),
      makePlan({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        name: "Pro",
        slug: "pro",
        maxConcurrentParticipants: 25,
        maxRoomDurationMinutes: 240,
      }),
    ]);
    expect(listed.map((p) => p.slug)).toEqual(["free", "pro"]);
  });

  it("identifies the current user plan by id", () => {
    const current = makePlan();
    const other = makePlan({
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      slug: "starter",
      name: "Starter",
    });
    expect(isCurrentUserPlan(current, current.id)).toBe(true);
    expect(isCurrentUserPlan(other, current.id)).toBe(false);
    expect(isCurrentUserPlan(current, null)).toBe(false);
  });

  it("labels null duration as Unlimited", () => {
    expect(
      formatPlanDurationDisplay(
        makePlan({ maxRoomDurationMinutes: null, name: "Business" }),
      ),
    ).toBe("Unlimited");
    expect(formatPlanDurationDisplay(makePlan({ maxRoomDurationMinutes: 60 }))).toBe(
      "60 minutes",
    );
  });

  it("builds a comparison matrix from active plans without inventing limits", () => {
    const free = makePlan({
      maxConcurrentParticipants: 5,
      maxRoomDurationMinutes: 60,
    });
    const business = makePlan({
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      name: "Business",
      slug: "business",
      maxConcurrentParticipants: 50,
      maxRoomDurationMinutes: null,
    });
    const rows = buildPlanComparisonRows([free, business]);
    const concurrent = rows.find(
      (row) => row.feature === "Maximum concurrent participants",
    );
    const duration = rows.find((row) => row.feature === "Maximum room duration");
    const chat = rows.find((row) => row.feature === "Chat");
    const rooms = rows.find((row) => row.feature === "Number of rooms");

    expect(concurrent?.values).toEqual(["5 participants", "50 participants"]);
    expect(duration?.values).toEqual(["60 minutes", "Unlimited"]);
    expect(chat?.values).toEqual(["✓", "✓"]);
    expect(rooms?.values).toEqual(["Unlimited", "Unlimited"]);
    expect(rows.every((row) => row.values.length === 2)).toBe(true);
  });
});

describe("audit sanitize still strips secrets", () => {
  it("strips password-like keys", () => {
    expect(
      sanitizeAuditMetadata({
        planId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        password: "secret",
        token: "abc",
      }),
    ).toEqual({
      planId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
  });
});
