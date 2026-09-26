"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DemoLoginButton } from "@/components/landing/demo-login-button";

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

const TILES = [
  { name: "Alex", role: "Host" },
  { name: "Sam", role: "" },
  { name: "Jordan", role: "" },
  { name: "Riley", role: "" },
] as const;

const CHAT_LINES = [
  { who: "Sam", text: "Sharing the deck now" },
  { who: "Jordan", text: "Looks sharp" },
  { who: "Riley", text: "Hand up in a sec" },
] as const;

/**
 * Single-viewport marketing home — no scroll.
 * Primary CTA sits under the copy; mobile also pins it to the bottom.
 */
export function LandingPage({ user }: LandingPageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [chatIndex, setChatIndex] = useState(0);
  const [handRaised, setHandRaised] = useState(false);

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

  useEffect(() => {
    const speakTimer = window.setInterval(() => {
      setSpeakingIndex((i) => (i + 1) % TILES.length);
    }, 2800);
    const chatTimer = window.setInterval(() => {
      setChatIndex((i) => (i + 1) % CHAT_LINES.length);
    }, 3200);
    const handTimer = window.setInterval(() => {
      setHandRaised((v) => !v);
    }, 4500);
    return () => {
      window.clearInterval(speakTimer);
      window.clearInterval(chatTimer);
      window.clearInterval(handTimer);
    };
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    function onMove(event: PointerEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--mx", `${x * 10}deg`);
      el.style.setProperty("--my", `${y * -8}deg`);
      el.style.setProperty("--tx", `${x * 12}px`);
      el.style.setProperty("--ty", `${y * 10}px`);
    }

    function onLeave() {
      if (!el) return;
      el.style.setProperty("--mx", "0deg");
      el.style.setProperty("--my", "0deg");
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const primaryHref = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Open desk" : "Start";
  const chat = CHAT_LINES[chatIndex];

  return (
    <div className="mc-landing-lock relative isolate flex w-full flex-col overflow-hidden overscroll-none text-[var(--room-fg)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="mc-stage-aura mc-stage-aura-1" />
        <div className="mc-stage-aura mc-stage-aura-2" />
        <div className="mc-stage-aura mc-stage-aura-3" />
        <div className="mc-stage-grid" />
        <div className="mc-stage-scan" />
        <div className="mc-stage-beam" />
        <div className="mc-stage-dust">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="mc-stage-orbit">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid h-full w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-4 pb-36 pt-14 sm:gap-8 sm:px-6 sm:pb-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-8">
        <div className="flex max-w-xl flex-col justify-center gap-4 lg:gap-5">
          <p className="mc-stage-brand text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.045em]">
            Webinari
          </p>

          <div className="space-y-2.5">
            <h1 className="mc-stage-in-2 text-[clamp(1.25rem,2.8vw,1.85rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-white/95 text-balance">
              A room that opens when it should.
              <span className="mc-stage-caret" aria-hidden />
            </h1>
            <span className="mc-stage-rule block h-px w-16 bg-[color-mix(in_oklch,var(--live)_85%,white)]" />
            <p className="mc-stage-in-3 max-w-md text-sm leading-relaxed text-white/60">
              Schedule the window, share one invite, and meet — without a noisy
              call UI.
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

          {/* Desktop/tablet: CTA after copy. Mobile uses the bottom bar only. */}
          <div className="mc-stage-in-3 relative hidden flex-col gap-2.5 sm:flex">
            <div className="flex flex-row flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="mc-stage-primary-btn inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-[0.9375rem] font-semibold tracking-[-0.02em] text-black transition-opacity hover:opacity-90"
              >
                {primaryLabel}
              </Link>
              {!user ? <DemoLoginButton /> : null}
              {!user ? (
                <Link
                  href="/login"
                  className="text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div
          aria-hidden
          ref={frameRef}
          className="mc-stage-frame mc-stage-parallax relative mx-auto hidden w-full max-w-md sm:block lg:max-w-none"
        >
          <div className="mc-stage-glow" />
          <div className="mc-stage-ring" />
          <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_92%,black)] shadow-[0_30px_80px_-24px_oklch(0_0_0/0.65)]">
            <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-white">
                  Weekly standup
                </p>
                <p className="mt-1 flex items-center gap-2 text-[0.65rem] text-white/45">
                  <span className="mc-stage-live-dot" />
                  Live · {TILES.length} present
                </p>
              </div>
              <span className="mc-stage-clock font-mono text-[0.65rem] tabular-nums tracking-wide text-white/35">
                14:02
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/8 p-px">
              {TILES.map((tile, index) => {
                const speaking = index === speakingIndex;
                const delayClass =
                  index === 0
                    ? "mc-stage-a"
                    : index === 1
                      ? "mc-stage-b"
                      : index === 2
                        ? "mc-stage-c"
                        : "mc-stage-d";
                return (
                  <div
                    key={tile.name}
                    className={`mc-stage-tile relative aspect-[16/11] overflow-hidden bg-[var(--room-tile)] ${delayClass} ${
                      speaking ? "mc-stage-speaking" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklch,var(--brand)_22%,transparent),transparent_62%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-11 items-center justify-center rounded-md bg-white/10 text-sm font-semibold text-white/85">
                        {tile.name.slice(0, 1)}
                      </span>
                    </div>
                    {speaking ? (
                      <div className="mc-stage-waves absolute bottom-8 left-1/2 flex -translate-x-1/2 items-end gap-0.5">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    {index === 3 && handRaised ? (
                      <span className="mc-stage-hand absolute top-2 right-2 rounded-md border border-white/15 bg-black/50 px-1.5 py-0.5 text-[0.55rem] font-medium tracking-wide text-white/80 uppercase">
                        Hand
                      </span>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6">
                      <p className="truncate text-[0.65rem] font-medium text-white/90">
                        {tile.name}
                        {tile.role ? ` · ${tile.role}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mc-stage-chat relative border-t border-white/10 px-3 py-2">
              <div
                key={chat.who + chat.text}
                className="mc-stage-chat-line flex items-baseline gap-2 text-[0.65rem]"
              >
                <span className="font-semibold text-white/80">{chat.who}</span>
                <span className="truncate text-white/50">{chat.text}</span>
              </div>
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

      <div className="mc-stage-mobile-cta pointer-events-none absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col gap-2">
          <Link
            href={primaryHref}
            className="mc-stage-mobile-cta-btn mc-stage-primary-btn flex h-12 items-center justify-center rounded-lg bg-white text-[0.9375rem] font-semibold tracking-[-0.02em] text-black transition-opacity hover:opacity-90"
          >
            {primaryLabel}
          </Link>
          {!user ? <DemoLoginButton size="mobile" /> : null}
          {!user ? (
            <Link
              href="/login"
              className="flex h-9 items-center justify-center text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Log in
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
