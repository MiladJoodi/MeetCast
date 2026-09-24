"use client";

import { useEffect, useState } from "react";
import { ParticipantEvent, type Participant } from "livekit-client";

export type MeetingRoleLabel = "host" | "moderator" | "participant" | "guest";

/** Role is embedded in LiveKit participant metadata by the token issuer / role sync. */
export function roleFromParticipant(participant: Participant): MeetingRoleLabel {
  try {
    const raw = participant.metadata;
    if (!raw) {
      return participant.identity.startsWith("guest:") ? "guest" : "participant";
    }
    const parsed = JSON.parse(raw) as { role?: string };
    if (
      parsed.role === "host" ||
      parsed.role === "moderator" ||
      parsed.role === "participant" ||
      parsed.role === "guest"
    ) {
      return parsed.role;
    }
  } catch {
    // ignore malformed metadata
  }
  return participant.identity.startsWith("guest:") ? "guest" : "participant";
}

/** Live role label — re-renders when LiveKit participant metadata changes. */
export function useParticipantRole(participant: Participant): MeetingRoleLabel {
  const [role, setRole] = useState(() => roleFromParticipant(participant));

  useEffect(() => {
    const sync = () => {
      setRole(roleFromParticipant(participant));
    };
    sync();
    participant.on(ParticipantEvent.ParticipantMetadataChanged, sync);
    return () => {
      participant.off(ParticipantEvent.ParticipantMetadataChanged, sync);
    };
  }, [participant]);

  return role;
}
