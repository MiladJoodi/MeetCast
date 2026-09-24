import { describe, expect, it } from "vitest";

import { sanitize } from "@/lib/logger";
import { grantsForRole } from "@/lib/livekit/grants";
import {
  clampPageToTotal,
  normalizeAdminSearchQuery,
  ADMIN_MAX_SEARCH_LENGTH,
} from "@/lib/admin/pagination";
import {
  decodeGuestSession,
  encodeGuestSession,
  signGuestPayload,
} from "@/lib/rooms/guest-cookie";
import { isRateLimitExceeded } from "@/lib/security/rate-limit-policy";
import { safeSameOriginPath } from "@/lib/security/safe-path";
import { assertSameOrigin } from "@/lib/security/same-origin";
import { AppError } from "@/lib/errors";

const SECRET = "test-auth-secret-at-least-32-characters-long";

describe("auth messaging expectations", () => {
  it("documents generic login and register failure copy", () => {
    expect("Invalid email or password.").not.toMatch(/exist/i);
    expect("Unable to create your account. Please try again.").not.toMatch(
      /already exists/i,
    );
  });
});

describe("rate limit helper", () => {
  it("rejects when used reaches the limit", () => {
    expect(isRateLimitExceeded(10, 10)).toBe(true);
    expect(isRateLimitExceeded(9, 10)).toBe(false);
  });
});

describe("LiveKit grants", () => {
  it("gives roomAdmin only to host", () => {
    expect(grantsForRole("host").roomAdmin).toBe(true);
    expect(grantsForRole("moderator").roomAdmin).toBe(false);
    expect(grantsForRole("participant").roomAdmin).toBe(false);
    expect(grantsForRole("guest").roomAdmin).toBe(false);
  });
});

describe("guest cookie integrity", () => {
  const base = {
    guestId: "guest-abc",
    roomId: "11111111-1111-4111-8111-111111111111",
    displayName: "Guest",
    expiresAt: Date.now() + 60_000,
  };

  it("rejects tampered roomId", () => {
    const encoded = encodeGuestSession(base, SECRET);
    const decoded = decodeGuestSession(encoded, SECRET);
    expect(decoded).not.toBeNull();

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    payload.roomId = "22222222-2222-4222-8222-222222222222";
    const tampered = Buffer.from(JSON.stringify(payload)).toString("base64url");
    expect(decodeGuestSession(tampered, SECRET)).toBeNull();
  });

  it("rejects bad signature", () => {
    const sig = signGuestPayload(base, SECRET);
    const bad = encodeGuestSession({ ...base, displayName: "Other" }, SECRET);
    const payload = JSON.parse(
      Buffer.from(bad, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    payload.sig = sig;
    const tampered = Buffer.from(JSON.stringify(payload)).toString("base64url");
    expect(decodeGuestSession(tampered, SECRET)).toBeNull();
  });
});

describe("safeSameOriginPath", () => {
  it("accepts relative app paths", () => {
    expect(safeSameOriginPath("/dashboard")).toBe("/dashboard");
    expect(safeSameOriginPath("/room/abc")).toBe("/room/abc");
  });

  it("rejects external and protocol-relative targets", () => {
    expect(safeSameOriginPath("https://evil.com")).toBeNull();
    expect(safeSameOriginPath("//evil.com")).toBeNull();
    expect(safeSameOriginPath("/\\evil")).toBeNull();
    expect(safeSameOriginPath("javascript:alert(1)")).toBeNull();
  });
});

describe("assertSameOrigin", () => {
  it("allows matching Origin", () => {
    const request = new Request("https://app.example.com/api/livekit/token", {
      method: "POST",
      headers: {
        host: "app.example.com",
        origin: "https://app.example.com",
      },
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects cross-origin", () => {
    const request = new Request("https://app.example.com/api/livekit/token", {
      method: "POST",
      headers: {
        host: "app.example.com",
        origin: "https://evil.example.com",
      },
    });
    expect(() => assertSameOrigin(request)).toThrow(AppError);
  });
});

describe("admin pagination helpers", () => {
  it("clamps absurd pages and long search queries", () => {
    expect(clampPageToTotal(999_999, 40)).toBe(4);
    expect(clampPageToTotal(0, 40)).toBe(1);
    expect(normalizeAdminSearchQuery("a".repeat(500)).length).toBe(
      ADMIN_MAX_SEARCH_LENGTH,
    );
  });
});

describe("logger sanitize", () => {
  it("strips password and token keys", () => {
    expect(
      sanitize({
        password: "secret",
        token: "abc",
        userId: "u1",
      }),
    ).toEqual({
      password: "[redacted]",
      token: "[redacted]",
      userId: "u1",
    });
  });
});
