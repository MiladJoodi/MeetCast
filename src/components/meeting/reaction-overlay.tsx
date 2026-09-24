"use client";

import { useReactionsOnly } from "@/components/meeting/collaboration-provider";

/**
 * Temporary floating reactions. Caps visible nodes; each entry self-removes via provider TTL.
 */
export function ReactionOverlay() {
  const { reactions } = useReactionsOnly();

  if (reactions.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-wrap items-end justify-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {reactions.map((reaction, index) => {
        const offset = ((index * 37) % 5) - 2;
        return (
          <div
            key={reaction.id}
            className="animate-in fade-in zoom-in-95 duration-300 fill-mode-forwards slide-in-from-bottom-2"
            style={{ transform: `translateX(${offset * 8}px)` }}
          >
            <span className="inline-flex max-w-[10rem] items-center gap-1.5 border border-white/15 bg-black/70 px-2 py-1 text-[oklch(0.94_0.01_85)]">
              <span className="text-base leading-none" aria-hidden>
                {reaction.emoji}
              </span>
              <span className="truncate text-[0.6875rem] font-medium">
                {reaction.senderName}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
