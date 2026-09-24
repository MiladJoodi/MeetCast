import { describe, expect, it } from "vitest";

import { sanitizeAuditMetadata } from "@/lib/admin/audit-sanitize";
import {
  assertCanBlockUserAsAdmin,
  assertCanChangeUserRole,
  assertCanDeleteUserAsAdmin,
  isAdmin,
  isValidUserRole,
} from "@/lib/admin/policy";
import { AppError } from "@/lib/errors";
import { deriveRoomStatus } from "@/lib/rooms/schedule";

const actor = "11111111-1111-4111-8111-111111111111";
const target = "22222222-2222-4222-8222-222222222222";

describe("admin role policy", () => {
  it("recognizes admin users", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
    expect(isAdmin({ role: "user" })).toBe(false);
  });

  it("rejects invalid roles", () => {
    expect(isValidUserRole("moderator")).toBe(false);
    expect(isValidUserRole("admin")).toBe(true);
  });

  it("allows promoting a user to admin", () => {
    expect(() =>
      assertCanChangeUserRole({
        actorId: actor,
        targetId: target,
        targetCurrentRole: "user",
        nextRole: "admin",
        adminCount: 1,
      }),
    ).not.toThrow();
  });

  it("allows demoting another admin when more than one remains", () => {
    expect(() =>
      assertCanChangeUserRole({
        actorId: actor,
        targetId: target,
        targetCurrentRole: "admin",
        nextRole: "user",
        adminCount: 2,
      }),
    ).not.toThrow();
  });

  it("blocks demoting the last admin", () => {
    expect(() =>
      assertCanChangeUserRole({
        actorId: actor,
        targetId: target,
        targetCurrentRole: "admin",
        nextRole: "user",
        adminCount: 1,
      }),
    ).toThrow(AppError);
  });

  it("blocks self-demotion", () => {
    expect(() =>
      assertCanChangeUserRole({
        actorId: actor,
        targetId: actor,
        targetCurrentRole: "admin",
        nextRole: "user",
        adminCount: 3,
      }),
    ).toThrow(AppError);
  });
});

describe("admin delete policy", () => {
  it("allows deleting another user", () => {
    expect(() =>
      assertCanDeleteUserAsAdmin({ actorId: actor, targetId: target }),
    ).not.toThrow();
  });

  it("blocks self-deletion via admin panel", () => {
    expect(() =>
      assertCanDeleteUserAsAdmin({ actorId: actor, targetId: actor }),
    ).toThrow(AppError);
  });
});

describe("admin block policy", () => {
  it("allows blocking another user", () => {
    expect(() =>
      assertCanBlockUserAsAdmin({
        actorId: actor,
        targetId: target,
        targetRole: "user",
        adminCount: 1,
      }),
    ).not.toThrow();
  });

  it("blocks self-block", () => {
    expect(() =>
      assertCanBlockUserAsAdmin({
        actorId: actor,
        targetId: actor,
        targetRole: "admin",
        adminCount: 2,
      }),
    ).toThrow(AppError);
  });

  it("blocks blocking the last admin", () => {
    expect(() =>
      assertCanBlockUserAsAdmin({
        actorId: actor,
        targetId: target,
        targetRole: "admin",
        adminCount: 1,
      }),
    ).toThrow(AppError);
  });
});

describe("audit metadata", () => {
  it("strips secret-like keys", () => {
    expect(
      sanitizeAuditMetadata({
        from: "user",
        to: "admin",
        password: "nope",
        token: "abc",
        nested: { apiSecret: "x", title: "Room" },
      }),
    ).toEqual({
      from: "user",
      to: "admin",
      nested: { title: "Room" },
    });
  });
});

describe("end room schedule effect", () => {
  it("marks a live room ended when endTime is set to now", () => {
    const start = new Date("2026-09-24T10:00:00.000Z");
    const end = new Date("2026-09-24T12:00:00.000Z");
    const now = new Date("2026-09-24T11:00:00.000Z");
    expect(deriveRoomStatus({ startTime: start, endTime: end }, now)).toBe(
      "live",
    );
    expect(
      deriveRoomStatus({ startTime: start, endTime: now }, now),
    ).toBe("ended");
  });
});
