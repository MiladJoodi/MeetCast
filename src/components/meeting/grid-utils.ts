import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";

/** CSS grid columns tuned for up to 50 small tiles without oversized videos. */
export function gridTemplateColumns(count: number): string {
  if (count <= 1) return "minmax(0, 1fr)";
  if (count === 2) return "repeat(2, minmax(0, 1fr))";
  if (count <= 4) return "repeat(2, minmax(0, 1fr))";
  if (count <= 9) return "repeat(3, minmax(0, 1fr))";
  if (count <= 16) return "repeat(4, minmax(0, 1fr))";
  if (count <= 25) return "repeat(5, minmax(0, 1fr))";
  if (count <= 36) return "repeat(6, minmax(0, 1fr))";
  return "repeat(auto-fill, minmax(140px, 1fr))";
}

/** Row tracks that fill available height without forcing aspect overflow. */
export function gridTemplateRows(count: number): string {
  if (count <= 1) return "minmax(0, 1fr)";
  if (count === 2) return "minmax(0, 1fr)";
  if (count <= 4) return "repeat(2, minmax(0, 1fr))";
  if (count <= 9) return "repeat(3, minmax(0, 1fr))";
  if (count <= 16) return "repeat(4, minmax(0, 1fr))";
  if (count <= 25) return "repeat(5, minmax(0, 1fr))";
  if (count <= 36) return "repeat(6, minmax(0, 1fr))";
  return "auto";
}

export function trackKey(trackRef: TrackReferenceOrPlaceholder): string {
  const identity = trackRef.participant.identity;
  const source = trackRef.source;
  const sid =
    "publication" in trackRef && trackRef.publication
      ? trackRef.publication.trackSid
      : "placeholder";
  return `${identity}:${source}:${sid}`;
}

export function displayNameForParticipant(name: string | undefined, identity: string): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }
  // Avoid dumping full opaque identities in the UI.
  if (identity.startsWith("user:")) {
    return "Participant";
  }
  if (identity.startsWith("guest:")) {
    return "Guest";
  }
  return "Participant";
}
