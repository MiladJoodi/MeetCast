import { describe, expect, it } from "vitest";

import {
  canGuestJoinByVisibility,
  isActorAllowedByVisibility,
} from "@/lib/rooms/visibility-access";
import {
  createRoomSchema,
  parseAllowedEmailsInput,
} from "@/lib/rooms/validation";

const hostId = "host-user-1";
const guestList = ["alice@example.com", "bob@example.com"];

describe("isActorAllowedByVisibility", () => {
  it("allows anyone when public, even with an empty or populated list", () => {
    expect(
      isActorAllowedByVisibility({
        visibility: "public",
        hostUserId: hostId,
        allowedEmails: [],
      }),
    ).toBe(true);

    expect(
      isActorAllowedByVisibility({
        visibility: "public",
        hostUserId: hostId,
        email: "stranger@example.com",
        allowedEmails: guestList,
      }),
    ).toBe(true);
  });

  it("allows the host on private rooms without being on the list", () => {
    expect(
      isActorAllowedByVisibility({
        visibility: "private",
        hostUserId: hostId,
        actorUserId: hostId,
        email: "host@example.com",
        allowedEmails: guestList,
      }),
    ).toBe(true);
  });

  it("allows an allowlisted email on private rooms", () => {
    expect(
      isActorAllowedByVisibility({
        visibility: "private",
        hostUserId: hostId,
        actorUserId: "user-2",
        email: "Alice@Example.com",
        allowedEmails: guestList,
      }),
    ).toBe(true);
  });

  it("denies a non-listed email on private rooms", () => {
    expect(
      isActorAllowedByVisibility({
        visibility: "private",
        hostUserId: hostId,
        actorUserId: "user-3",
        email: "eve@example.com",
        allowedEmails: guestList,
      }),
    ).toBe(false);
  });

  it("denies private access without an authenticated email", () => {
    expect(
      isActorAllowedByVisibility({
        visibility: "private",
        hostUserId: hostId,
        actorUserId: "user-3",
        allowedEmails: guestList,
      }),
    ).toBe(false);
  });
});

describe("canGuestJoinByVisibility", () => {
  it("allows guests only on public rooms", () => {
    expect(canGuestJoinByVisibility("public")).toBe(true);
    expect(canGuestJoinByVisibility("private")).toBe(false);
  });
});

describe("room visibility validation", () => {
  const base = {
    title: "Standup",
    maxParticipants: 5,
    startTime: new Date("2026-09-24T12:00:00.000Z"),
    endTime: new Date("2026-09-24T12:30:00.000Z"),
  };

  it("requires at least one email for private rooms", () => {
    const result = createRoomSchema.safeParse({
      ...base,
      visibility: "private",
      allowedEmails: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("allowedEmails");
    }
  });

  it("allows public rooms with an empty allowlist", () => {
    const result = createRoomSchema.safeParse({
      ...base,
      visibility: "public",
      allowedEmails: "",
    });
    expect(result.success).toBe(true);
  });

  it("parses and keeps emails for later private use", () => {
    expect(parseAllowedEmailsInput("a@x.com, b@y.com")).toEqual([
      "a@x.com",
      "b@y.com",
    ]);
  });
});
