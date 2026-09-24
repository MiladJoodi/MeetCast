import { describe, expect, it } from "vitest";

import { MAX_SESSIONS_PER_USER } from "@/lib/auth/constants";
import {
  canRevokeIndividualSession,
  filterSessionsToRevokeOthers,
  sessionIdsOverCap,
} from "@/lib/auth/session-policy";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@/lib/auth/validation";

describe("updateProfileSchema", () => {
  it("accepts a valid display name and email", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "  Ada Lovelace  ",
      email: "Ada@Example.COM",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Ada Lovelace");
      expect(parsed.data.email).toBe("ada@example.com");
    }
  });

  it("rejects an empty display name", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "   ",
      email: "ada@example.com",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid password change", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password-1",
      confirmNewPassword: "new-password-1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects confirmation mismatch", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password-1",
      confirmNewPassword: "different",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects short new passwords", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "short",
      confirmNewPassword: "short",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects reusing the current password", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "same-password",
      newPassword: "same-password",
      confirmNewPassword: "same-password",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  it("requires a password", () => {
    expect(deleteAccountSchema.safeParse({ password: "" }).success).toBe(
      false,
    );
    expect(
      deleteAccountSchema.safeParse({ password: "secret" }).success,
    ).toBe(true);
  });
});

describe("session revoke policy", () => {
  const current = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";

  it("does not allow revoking the current session individually", () => {
    expect(
      canRevokeIndividualSession({
        sessionId: current,
        currentSessionId: current,
      }),
    ).toBe(false);
  });

  it("allows revoking another session", () => {
    expect(
      canRevokeIndividualSession({
        sessionId: other,
        currentSessionId: current,
      }),
    ).toBe(true);
  });

  it("revoke-others keeps the current session", () => {
    expect(
      filterSessionsToRevokeOthers({
        sessionIds: [current, other, "33333333-3333-4333-8333-333333333333"],
        currentSessionId: current,
      }),
    ).toEqual([other, "33333333-3333-4333-8333-333333333333"]);
  });

  it("caps overflow to the oldest sessions", () => {
    const ids = Array.from({ length: MAX_SESSIONS_PER_USER + 3 }, (_, i) =>
      String(i),
    );
    expect(sessionIdsOverCap(ids, MAX_SESSIONS_PER_USER)).toEqual([
      "0",
      "1",
      "2",
    ]);
  });
});
