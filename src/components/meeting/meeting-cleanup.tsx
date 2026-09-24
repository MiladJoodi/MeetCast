"use client";

import { useEffect, useRef } from "react";
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";

import { stopLocalMedia } from "@/components/meeting/media-cleanup";

/**
 * Ensures local capture stops on navigate-away and tab close.
 * LiveKitRoom handles disconnect on React unmount; we avoid calling
 * disconnect here so Strict Mode remounts do not tear down a healthy room.
 */
export function MeetingCleanup() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const localParticipantRef = useRef(localParticipant);
  const roomRef = useRef(room);

  useEffect(() => {
    localParticipantRef.current = localParticipant;
    roomRef.current = room;
  }, [localParticipant, room]);

  useEffect(() => {
    const onPageHide = () => {
      const participant = localParticipantRef.current;
      const activeRoom = roomRef.current;
      void stopLocalMedia(participant);
      try {
        void activeRoom.disconnect(true);
      } catch {
        // ignore teardown races
      }
    };

    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      void stopLocalMedia(localParticipantRef.current);
    };
  }, []);

  return null;
}
