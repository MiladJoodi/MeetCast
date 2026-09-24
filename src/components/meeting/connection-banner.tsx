"use client";

import { useEffect, useRef, useState } from "react";
import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

import { Button } from "@/components/ui/button";

type ConnectionBannerProps = {
  onRetry?: () => void;
};

/**
 * Unobtrusive connection status.
 * Shows reconnecting / disconnected; briefly announces "Reconnected".
 */
export function ConnectionBanner({ onRetry }: ConnectionBannerProps) {
  const state = useConnectionState();
  const prevState = useRef(state);
  const [showReconnected, setShowReconnected] = useState(false);
  const [offerRetry, setOfferRetry] = useState(false);

  useEffect(() => {
    const previous = prevState.current;
    prevState.current = state;

    if (
      previous !== ConnectionState.Reconnecting ||
      state !== ConnectionState.Connected
    ) {
      return;
    }

    let hideTimer = 0;
    const showTimer = window.setTimeout(() => {
      setShowReconnected(true);
      hideTimer = window.setTimeout(() => {
        setShowReconnected(false);
      }, 2500);
    }, 0);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [state]);

  useEffect(() => {
    if (
      state !== ConnectionState.Connecting &&
      state !== ConnectionState.Reconnecting &&
      state !== ConnectionState.SignalReconnecting
    ) {
      const reset = window.setTimeout(() => {
        setOfferRetry(false);
      }, 0);
      return () => window.clearTimeout(reset);
    }

    const timer = window.setTimeout(() => {
      setOfferRetry(true);
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === ConnectionState.Connected) {
    if (!showReconnected) {
      return null;
    }
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-b border-border bg-muted/80 px-3 py-2 text-center text-sm text-muted-foreground"
      >
        Reconnected
      </div>
    );
  }

  let message = "Connecting…";
  let showRetry = offerRetry;

  if (
    state === ConnectionState.Reconnecting ||
    state === ConnectionState.SignalReconnecting
  ) {
    message =
      "Reconnecting… Your meeting will resume when the connection recovers.";
  } else if (state === ConnectionState.Disconnected) {
    message = "Disconnected from the meeting.";
    showRetry = true;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-center gap-2 border-b border-border bg-muted px-3 py-2 text-center text-sm text-muted-foreground"
    >
      <span>{message}</span>
      {showRetry ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (onRetry) {
              onRetry();
              return;
            }
            window.location.reload();
          }}
        >
          Rejoin
        </Button>
      ) : null}
    </div>
  );
}
