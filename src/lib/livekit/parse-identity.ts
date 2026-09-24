/**
 * Parse and validate LiveKit identities issued by MeetCast.
 * Never trust client-supplied room IDs embedded in guest identities without matching the current room.
 */
export type ParsedLiveKitIdentity =
  | { kind: "user"; userId: string }
  | { kind: "guest"; roomId: string; guestId: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseLiveKitIdentity(
  identity: string,
): ParsedLiveKitIdentity | null {
  if (identity.startsWith("user:")) {
    const userId = identity.slice("user:".length);
    if (!UUID_RE.test(userId)) {
      return null;
    }
    return { kind: "user", userId };
  }

  if (identity.startsWith("guest:")) {
    const rest = identity.slice("guest:".length);
    const separator = rest.indexOf(":");
    if (separator <= 0) {
      return null;
    }
    const roomId = rest.slice(0, separator);
    const guestId = rest.slice(separator + 1);
    if (!UUID_RE.test(roomId) || !guestId || guestId.length > 128) {
      return null;
    }
    return { kind: "guest", roomId, guestId };
  }

  return null;
}

export function userIdFromLiveKitIdentity(identity: string): string | null {
  const parsed = parseLiveKitIdentity(identity);
  return parsed?.kind === "user" ? parsed.userId : null;
}
