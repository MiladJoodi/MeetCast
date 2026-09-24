"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  VideoTrack,
  isTrackReference,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Maximize2, Minimize2, Monitor } from "lucide-react";

import { displayNameForParticipant, trackKey } from "@/components/meeting/grid-utils";
import { Button } from "@/components/ui/button";

/**
 * Prominent stage for active screen shares.
 * Multiple shares: first track is large; additional shares appear as a strip.
 */
export function ScreenShareStage() {
  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  ).filter(isTrackReference);

  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) {
      return;
    }

    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Browser denied fullscreen or API unavailable.
    }
  }, []);

  if (screenTracks.length === 0) {
    return null;
  }

  const [primary, ...rest] = screenTracks;

  return (
    <div className="flex min-h-0 flex-col gap-2 border-b border-border bg-muted/30 p-2 sm:p-3">
      <div
        ref={stageRef}
        className={
          isFullscreen
            ? "relative h-full w-full overflow-hidden bg-black"
            : "relative min-h-[40vh] flex-1 overflow-hidden rounded-lg bg-black ring-1 ring-border sm:min-h-[45vh]"
        }
      >
        <VideoTrack
          trackRef={primary}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
          <Monitor className="size-3.5" aria-hidden />
          <span>
            {displayNameForParticipant(
              primary.participant.name,
              primary.participant.identity,
            )}
            {" · Screen"}
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="absolute top-2 right-2 bg-black/60 text-white hover:bg-black/80 hover:text-white"
          aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          onClick={() => void toggleFullscreen()}
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" aria-hidden />
          ) : (
            <Maximize2 className="size-4" aria-hidden />
          )}
        </Button>
      </div>

      {rest.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rest.map((trackRef) => (
            <div
              key={trackKey(trackRef)}
              className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md bg-black ring-1 ring-border"
            >
              <VideoTrack
                trackRef={trackRef}
                className="h-full w-full object-contain"
              />
              <p className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                {displayNameForParticipant(
                  trackRef.participant.name,
                  trackRef.participant.identity,
                )}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
