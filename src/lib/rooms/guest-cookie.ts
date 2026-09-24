import { createHmac, timingSafeEqual } from "node:crypto";

import type { GuestSession } from "@/lib/rooms/guest-types";
import { GUEST_SESSION_MAX_AGE_MS } from "@/lib/rooms/constants";

type GuestCookiePayload = GuestSession & {
  sig: string;
};

export function signGuestPayload(
  payload: Omit<GuestCookiePayload, "sig">,
  secret: string,
): string {
  const email = payload.email ?? "";
  const body = `${payload.guestId}.${payload.roomId}.${payload.displayName}.${email}.${payload.expiresAt}`;
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function encodeGuestSession(
  session: GuestSession,
  secret: string,
): string {
  const payload: GuestCookiePayload = {
    ...session,
    sig: signGuestPayload(session, secret),
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeGuestSession(
  raw: string,
  secret: string,
  now: number = Date.now(),
): GuestSession | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as GuestCookiePayload;

    if (
      typeof parsed.guestId !== "string" ||
      typeof parsed.roomId !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.sig !== "string"
    ) {
      return null;
    }

    const email =
      typeof parsed.email === "string" && parsed.email.trim()
        ? parsed.email.trim().toLowerCase()
        : undefined;

    const expected = signGuestPayload(
      {
        guestId: parsed.guestId,
        roomId: parsed.roomId,
        displayName: parsed.displayName,
        email,
        expiresAt: parsed.expiresAt,
      },
      secret,
    );

    const a = Buffer.from(expected);
    const b = Buffer.from(parsed.sig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }

    if (parsed.expiresAt <= now) {
      return null;
    }

    return {
      guestId: parsed.guestId,
      roomId: parsed.roomId,
      displayName: parsed.displayName,
      email,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function guestExpiresAtMs(
  roomEndTime: Date,
  now: number = Date.now(),
): number {
  return Math.min(now + GUEST_SESSION_MAX_AGE_MS, roomEndTime.getTime());
}
