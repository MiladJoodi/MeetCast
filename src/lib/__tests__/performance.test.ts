import { describe, expect, it } from "vitest";

import { grantsForRole } from "@/lib/livekit/grants";
import {
  clampPageToTotal,
  normalizeAdminSearchQuery,
  ADMIN_MAX_SEARCH_LENGTH,
} from "@/lib/admin/pagination";
import {
  isoFromDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/rooms/datetime-local";
import { deriveRoomStatus } from "@/lib/rooms/schedule";
import { isRateLimitExceeded } from "@/lib/security/rate-limit-policy";
import { clampTokenTtlSeconds } from "@/lib/livekit/token-limits";

describe("Phase 6 performance regressions", () => {
  it("keeps admin pagination caps", () => {
    expect(clampPageToTotal(999_999, 40)).toBe(4);
    expect(normalizeAdminSearchQuery("x".repeat(500)).length).toBe(
      ADMIN_MAX_SEARCH_LENGTH,
    );
  });

  it("keeps LiveKit host-only roomAdmin", () => {
    expect(grantsForRole("host").roomAdmin).toBe(true);
    expect(grantsForRole("moderator").roomAdmin).toBe(false);
  });

  it("keeps rate-limit helper semantics", () => {
    expect(isRateLimitExceeded(5, 5)).toBe(true);
    expect(isRateLimitExceeded(4, 5)).toBe(false);
  });

  it("keeps token TTL clamping", () => {
    const ttl = clampTokenTtlSeconds({ secondsUntilEnd: 600 });
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(600);
  });

  it("client datetime helpers stay pure (no AppError import path)", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const local = toDatetimeLocalValue(now);
    expect(local.length).toBe(16);
    const iso = isoFromDatetimeLocal(local);
    expect(iso).toMatch(/Z$/);
  });

  it("deriveRoomStatus still distinguishes schedule windows", () => {
    const start = new Date("2026-06-01T10:00:00.000Z");
    const end = new Date("2026-06-01T12:00:00.000Z");
    expect(
      deriveRoomStatus({ startTime: start, endTime: end }, new Date("2026-06-01T09:00:00.000Z")),
    ).toBe("scheduled");
    expect(
      deriveRoomStatus({ startTime: start, endTime: end }, new Date("2026-06-01T11:00:00.000Z")),
    ).toBe("live");
    expect(
      deriveRoomStatus({ startTime: start, endTime: end }, new Date("2026-06-01T13:00:00.000Z")),
    ).toBe("ended");
  });
});
