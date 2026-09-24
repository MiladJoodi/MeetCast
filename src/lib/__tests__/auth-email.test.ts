import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";
import { hashAuthToken } from "@/lib/auth/token-hash";

describe("auth email validation", () => {
  it("accepts a normal forgot-password email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "Person@Example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("person@example.com");
    }
  });

  it("requires matching passwords on reset", () => {
    const bad = resetPasswordSchema.safeParse({
      token: "a".repeat(24),
      password: "securepass1",
      confirmPassword: "otherpass1",
    });
    expect(bad.success).toBe(false);

    const good = resetPasswordSchema.safeParse({
      token: "a".repeat(24),
      password: "securepass1",
      confirmPassword: "securepass1",
    });
    expect(good.success).toBe(true);
  });
});

describe("hashAuthToken", () => {
  it("is stable and hex-shaped", () => {
    const a = hashAuthToken("demo-token");
    const b = hashAuthToken("demo-token");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
