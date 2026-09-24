"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { toast } from "sonner";

import { leaveMeetingRoom } from "@/components/meeting/media-cleanup";
import { Button } from "@/components/ui/button";
import { applicableEndWarningsMs } from "@/lib/rooms/schedule";

type MeetingScheduleLifecycleProps = {
  startTimeIso: string;
  endTimeIso: string;
  leaveHref: string;
  /** Clears parent token/session so Rejoin cannot revive after endTime. */
  onMeetingEnded?: () => void;
};

/**
 * Client-side schedule UX: 10m/5m warnings and disconnect at endTime.
 * Uses timeouts to next event instead of a 1s polling interval.
 */
export function MeetingScheduleLifecycle({
  startTimeIso,
  endTimeIso,
  leaveHref,
  onMeetingEnded,
}: MeetingScheduleLifecycleProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const router = useRouter();
  const [ended, setEnded] = useState(false);
  const warnedRef = useRef(new Set<number>());
  const closedRef = useRef(false);

  useEffect(() => {
    const startTime = new Date(startTimeIso);
    const endTime = new Date(endTimeIso);
    const warningOffsets = applicableEndWarningsMs({ startTime, endTime });
    const timers: number[] = [];

    function endMeeting() {
      if (closedRef.current) {
        return;
      }
      closedRef.current = true;
      setEnded(true);
      onMeetingEnded?.();
      void leaveMeetingRoom(room, localParticipant).finally(() => {
        toast.message("This meeting has ended.");
      });
    }

    function scheduleWarningsAndEnd() {
      const now = Date.now();
      const remaining = endTime.getTime() - now;

      if (remaining <= 0) {
        endMeeting();
        return;
      }

      for (const offset of warningOffsets) {
        if (remaining <= offset) {
          if (!warnedRef.current.has(offset)) {
            warnedRef.current.add(offset);
            const minutes = Math.round(offset / 60_000);
            toast.warning(`${minutes} minutes remaining in this meeting.`);
          }
          continue;
        }
        const delay = remaining - offset;
        timers.push(
          window.setTimeout(() => {
            if (warnedRef.current.has(offset) || closedRef.current) {
              return;
            }
            warnedRef.current.add(offset);
            const minutes = Math.round(offset / 60_000);
            toast.warning(`${minutes} minutes remaining in this meeting.`);
          }, delay),
        );
      }

      timers.push(window.setTimeout(endMeeting, remaining));
    }

    scheduleWarningsAndEnd();
    return () => {
      for (const id of timers) {
        window.clearTimeout(id);
      }
    };
  }, [endTimeIso, localParticipant, onMeetingEnded, room, startTimeIso]);

  if (!ended) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-4">
      <div className="max-w-sm space-y-4 text-center">
        <h2 className="text-lg font-semibold tracking-tight">Meeting ended</h2>
        <p className="text-sm text-muted-foreground">
          The scheduled end time was reached. You are still signed in to
          MeetCast.
        </p>
        <Button type="button" onClick={() => router.push(leaveHref)}>
          Continue
        </Button>
      </div>
    </div>
  );
}
