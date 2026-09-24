import type { LiveKitAppRole } from "@/lib/livekit/identity";

/**
 * LiveKit JWT grants derived only from server-side application role.
 * roomAdmin is host-only so moderators cannot bypass app moderation via SFU APIs.
 */
export function grantsForRole(role: LiveKitAppRole) {
  return {
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
    roomAdmin: role === "host",
  };
}
