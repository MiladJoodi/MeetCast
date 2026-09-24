"use client";

import { useEffect } from "react";

type LandingPageProps = {
  user: { id: string } | null;
};

const CAPABILITIES = [
  "HD video & audio",
  "Screen sharing",
  "In-room chat",
  "Reactions & raise hand",
  "Guest join via invite",
  "Scheduled start & end",
  "Host moderation",
  "Honest plan limits",
] as const;

/**
 * Single-viewport marketing home — no scroll.
 * CTAs live in the transparent header; hero focuses on brand + capabilities.
 */
export function LandingPage({ user }: LandingPageProps) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const tiles = [
    { name: "Alex", role: "Host", speaking: true, className: "mc-stage-tile mc-stage-a" },
    { name: "Sam", role: "", speaking: false, className: "mc-stage-tile mc-stage-b" },
    { name: "Jordan", role: "", speaking: false, className: "mc-stage-tile mc-stage-c" },
    { name: "Riley", role: "", speaking: false, className: "mc-stage-tile mc-stage-d" },
  ] as const;

  return (
    <div className="mc-landing-lock relative isolate flex flex-1 flex-col overflow-hidden overscroll-none text-[var(--room-fg)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mc-stage-aura mc-stage-aura-1" />
        <div className="mc-stage-aura mc-stage-aura-2" />
        <div className="mc-stage-grid" />
        <div className="mc-stage-scan" />
        <div className="mc-stage-dust">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid h-full w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-4 pb-6 pt-14 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-8">
        <div className="flex max-w-xl flex-col justify-center gap-4 lg:gap-5">
          <p className="mc-stage-brand text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.045em]">
            MeetCast
          </p>

          <div className="space-y-2.5">
            <h1 className="mc-stage-in-2 text-[clamp(1.25rem,2.8vw,1.85rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-white/95 text-balance">
              A room that opens when it should.
            </h1>
            <span className="mc-stage-rule block h-px w-16 bg-[color-mix(in_oklch,var(--live)_85%,white)]" />
            <p className="mc-stage-in-3 max-w-md text-sm leading-relaxed text-white/60">
              Schedule the window, share one invite, and meet — without a noisy
              call UI.{" "}
              {user
                ? "Open your desk from the header when you’re ready."
                : "Log in or start from the header."}
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {CAPABILITIES.map((item, index) => (
              <li
                key={item}
                className="mc-stage-cap flex items-center gap-2 text-[0.8125rem] text-white/75"
                style={{ animationDelay: `${0.35 + index * 0.055}s` }}
              >
                <span
                  className="mc-stage-cap-dot size-1.5 shrink-0 rounded-full bg-[color-mix(in_oklch,var(--live)_80%,white)]"
                  style={{ animationDelay: `${index * 0.18}s` }}
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden
          className="mc-stage-frame relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="mc-stage-glow" />
          <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_92%,black)] shadow-[0_30px_80px_-24px_oklch(0_0_0/0.65)]">
            <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-white">
                  Weekly standup
                </p>
                <p className="mt-1 flex items-center gap-2 text-[0.65rem] text-white/45">
                  <span className="mc-stage-live-dot" />
                  Live · {tiles.length} present
                </p>
              </div>
              <span className="mc-stage-clock font-mono text-[0.65rem] tabular-nums tracking-wide text-white/35">
                14:02
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/8 p-px">
              {tiles.map((tile) => (
                <div
                  key={tile.name}
                  className={`relative aspect-[16/11] overflow-hidden bg-[var(--room-tile)] ${tile.className} ${
                    tile.speaking ? "mc-stage-speaking" : ""
                  }`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklch,var(--brand)_22%,transparent),transparent_62%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-11 items-center justify-center rounded-md bg-white/10 text-sm font-semibold text-white/85">
                      {tile.name.slice(0, 1)}
                    </span>
                  </div>
                  {tile.speaking ? (
                    <div className="mc-stage-waves absolute bottom-8 left-1/2 flex -translate-x-1/2 items-end gap-0.5">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6">
                    <p className="truncate text-[0.65rem] font-medium text-white/90">
                      {tile.name}
                      {tile.role ? ` · ${tile.role}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 border-t border-white/10 px-3 py-2.5">
              {["Mic", "Cam", "Share", "Chat"].map((label, i) => (
                <span
                  key={label}
                  className="mc-stage-ctrl rounded-md border border-white/10 px-2 py-1 text-[0.6rem] text-white/50"
                  style={{ animationDelay: `${0.55 + i * 0.06}s` }}
                >
                  {label}
                </span>
              ))}
              <span
                className="mc-stage-ctrl ml-auto rounded-md border border-danger/45 px-2 py-1 text-[0.6rem] text-[color-mix(in_oklch,var(--danger)_85%,white)]"
                style={{ animationDelay: "0.85s" }}
              >
                Leave
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
