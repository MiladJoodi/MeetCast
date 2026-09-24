import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { AppError } from "@/lib/errors";
import {
  assertProductionAuthSecrets,
  getRequiredEnv,
} from "@/lib/env";
import { GUEST_COOKIE_NAME } from "@/lib/rooms/constants";
import {
  decodeGuestSession,
  encodeGuestSession,
  guestExpiresAtMs,
} from "@/lib/rooms/guest-cookie";
import { isGuestRevoked } from "@/lib/rooms/guest-revoke";
import type { GuestSession } from "@/lib/rooms/guest-types";

export type { GuestSession } from "@/lib/rooms/guest-types";
export {
  decodeGuestSession,
  encodeGuestSession,
  guestExpiresAtMs,
  signGuestPayload,
} from "@/lib/rooms/guest-cookie";

function encodeGuestCookie(session: GuestSession): string {
  assertProductionAuthSecrets();
  return encodeGuestSession(session, getRequiredEnv("AUTH_SECRET"));
}

function decodeGuestCookie(raw: string): GuestSession | null {
  assertProductionAuthSecrets();
  return decodeGuestSession(raw, getRequiredEnv("AUTH_SECRET"));
}

function guestCookieOptions(expiresAt: Date) {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = Math.max(
    1,
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  );
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    maxAge,
  };
}

export async function createGuestSession(input: {
  roomId: string;
  displayName: string;
  email?: string;
  roomEndTime: Date;
}): Promise<GuestSession> {
  const now = Date.now();
  const expiresAt = guestExpiresAtMs(input.roomEndTime, now);
  if (expiresAt <= now) {
    throw new AppError("FORBIDDEN", "This room has ended.", 403);
  }

  const session: GuestSession = {
    guestId: randomBytes(16).toString("base64url"),
    roomId: input.roomId,
    displayName: input.displayName,
    email: input.email,
    expiresAt,
  };

  const cookieStore = await cookies();
  cookieStore.set(
    GUEST_COOKIE_NAME,
    encodeGuestCookie(session),
    guestCookieOptions(new Date(expiresAt)),
  );

  return session;
}

export async function getGuestSession(): Promise<GuestSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }
  return decodeGuestCookie(raw);
}

export async function getGuestSessionForRoom(
  roomId: string,
): Promise<GuestSession | null> {
  const session = await getGuestSession();
  if (!session || session.roomId !== roomId) {
    return null;
  }

  if (await isGuestRevoked({ roomId, guestId: session.guestId })) {
    await clearGuestSession();
    return null;
  }

  return session;
}

export async function clearGuestSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: GUEST_COOKIE_NAME,
    path: "/",
  });
}

/** Clear guest cookie only when it matches this identity in this room. */
export async function clearGuestSessionIfMatches(input: {
  roomId: string;
  guestId: string;
}): Promise<void> {
  const session = await getGuestSession();
  if (
    session &&
    session.roomId === input.roomId &&
    session.guestId === input.guestId
  ) {
    await clearGuestSession();
  }
}
