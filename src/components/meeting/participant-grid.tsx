"use client";

import {
  useTracks,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";

import { useRaisedHandsOnly } from "@/components/meeting/collaboration-provider";
import {
  gridTemplateColumns,
  gridTemplateRows,
  trackKey,
} from "@/components/meeting/grid-utils";
import { ParticipantTile } from "@/components/meeting/participant-tile";

export function ParticipantGrid() {
  const { localParticipant } = useLocalParticipant();
  const { raisedHands } = useRaisedHandsOnly();
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  const columns = gridTemplateColumns(tracks.length);
  const rows = gridTemplateRows(tracks.length);

  return (
    <div
      className="grid h-full min-h-0 min-w-0 w-full max-w-full flex-1 gap-2 overflow-hidden p-2 sm:gap-2.5 sm:p-3"
      style={{
        gridTemplateColumns: columns,
        gridTemplateRows: rows,
      }}
      role="list"
      aria-label="Participants"
    >
      {tracks.map((trackRef) => {
        const isLocal =
          trackRef.participant.identity === localParticipant.identity;
        return (
          <div
            key={trackKey(trackRef)}
            role="listitem"
            className="min-h-0 min-w-0 overflow-hidden"
          >
            <ParticipantTile
              trackRef={trackRef}
              isLocal={isLocal}
              handRaised={raisedHands.has(trackRef.participant.identity)}
            />
          </div>
        );
      })}
    </div>
  );
}
