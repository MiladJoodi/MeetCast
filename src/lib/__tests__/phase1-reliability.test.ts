import { describe, expect, it } from "vitest";

import { AppError, toSafeClientError } from "@/lib/errors";
import {
  assertParticipantCountWithinCapacity,
  clampTokenTtlSeconds,
} from "@/lib/livekit/token-limits";
import { sanitize } from "@/lib/logger";
import {
  decodeGuestSession,
  encodeGuestSession,
  guestExpiresAtMs,
  signGuestPayload,
} from "@/lib/rooms/guest-cookie";
import { assertJoinCapacityAvailable } from "@/lib/rooms/capacity";
import type { Room } from "@/db/schema";

describe("toSafeClientError", () => {
  it("returns AppError fields as-is", () => {
    const err = new AppError("ROOM_FULL", "Room is full.", 409);
    expect(toSafeClientError(err)).toEqual({
      code: "ROOM_FULL",
      message: "Room is full.",
      status: 409,
    });
  });

  it("never leaks internal Error details", () => {
    const err = new Error("DATABASE_URL=postgres://secret@host/db");
    expect(toSafeClientError(err)).toEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      status: 500,
    });
  });
});

describe("logger sanitize", () => {
  it("redacts sensitive keys recursively", () => {
    const cleaned = sanitize({
      ok: true,
      token: "abc",
      nested: {
        jwt: "xyz",
        inviteCode: "INVITE",
        deep: [{ apiSecret: "s", displayName: "Ada" }],
      },
    });

    expect(cleaned).toEqual({
      ok: true,
      token: "[redacted]",
      nested: {
        jwt: "[redacted]",
        inviteCode: "[redacted]",
        deep: [{ apiSecret: "[redacted]", displayName: "Ada" }],
      },
    });
  });
});

describe("guest cookie helpers", () => {
  const secret = "test-auth-secret-at-least-32-chars!!";
  const roomId = "22222222-2222-4222-8222-222222222222";
  const session = {
    guestId: "guest-abc",
    roomId,
    displayName: "Guest",
    expiresAt: Date.now() + 60_000,
  };

  it("round-trips a valid cookie", () => {
    const raw = encodeGuestSession(session, secret);
    expect(decodeGuestSession(raw, secret)).toEqual(session);
  });

  it("rejects tampered payloads", () => {
    const raw = encodeGuestSession(session, secret);
    const json = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    json.displayName = "Hacker";
    const tampered = Buffer.from(JSON.stringify(json), "utf8").toString(
      "base64url",
    );
    expect(decodeGuestSession(tampered, secret)).toBeNull();
  });

  it("rejects expired cookies", () => {
    const expired = { ...session, expiresAt: Date.now() - 1 };
    const raw = encodeGuestSession(expired, secret);
    expect(decodeGuestSession(raw, secret)).toBeNull();
  });

  it("rejects wrong secret", () => {
    const raw = encodeGuestSession(session, secret);
    expect(decodeGuestSession(raw, "other-secret")).toBeNull();
  });

  it("caps guest expiry to room endTime", () => {
    const now = Date.parse("2026-09-24T12:00:00.000Z");
    const end = new Date("2026-09-24T13:00:00.000Z");
    expect(guestExpiresAtMs(end, now)).toBe(end.getTime());
  });

  it("signs deterministically", () => {
    const a = signGuestPayload(session, secret);
    const b = signGuestPayload(session, secret);
    expect(a).toBe(b);
  });
});

describe("clampTokenTtlSeconds", () => {
  it("clamps to secondsUntilEnd", () => {
    expect(
      clampTokenTtlSeconds({
        requestedSeconds: 7200,
        secondsUntilEnd: 30,
      }),
    ).toBe(30);
  });

  it("never returns less than 1", () => {
    expect(
      clampTokenTtlSeconds({
        requestedSeconds: 0,
        secondsUntilEnd: 0,
      }),
    ).toBe(1);
  });
});

describe("capacity gates", () => {
  const room = {
    id: "11111111-1111-4111-8111-111111111111",
    maxParticipants: 2,
  } as Room;

  it("assertJoinCapacityAvailable rejects at limit", async () => {
    await expect(assertJoinCapacityAvailable(room, 2)).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("assertParticipantCountWithinCapacity rejects when full", () => {
    expect(() => assertParticipantCountWithinCapacity(2, 2)).toThrow(AppError);
    expect(() => assertParticipantCountWithinCapacity(1, 2)).not.toThrow();
  });
});
