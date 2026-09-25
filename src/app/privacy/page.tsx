import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingTourNav } from "@/components/marketing/marketing-tour-nav";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How MeetCast handles account and meeting data.",
};

const SECTIONS = [
  {
    num: "01",
    title: "What we collect",
    body: (
      <>
        Account details you provide (name, email, password hash), billing and
        plan records tied to your account, and room metadata (titles, schedules,
        invite codes, visibility, and guest-list emails you add). During a live
        meeting we process realtime media through our video provider so
        participants can see and hear each other.
      </>
    ),
  },
  {
    num: "02",
    title: "How we use it",
    body: (
      <>
        We use this data to run MeetCast: authenticate you, enforce room access
        (including private guest lists), schedule and host meetings, apply plan
        limits, and handle support or abuse reports. We do not sell your
        personal information.
      </>
    ),
  },
  {
    num: "03",
    title: "Retention and control",
    body: (
      <>
        You can update profile settings while signed in. Hosts control rooms
        they create, including guest lists and whether a room is public or
        private. If you need account deletion or a data question, contact us via
        the{" "}
        <Link
          href="/contact"
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          contact page
        </Link>
        .
      </>
    ),
  },
] as const;

export default function PrivacyPage() {
  return (
    <MarketingShell scrollable className="py-14 sm:py-16">
      <article className="space-y-10">
        <MarketingPageHeader
          eyebrow="Legal"
          title="Privacy"
          description="Last updated September 24, 2026. A short product summary — not a substitute for tailored legal advice."
          live={false}
        />

        <div className="space-y-4">
          {SECTIONS.map((section, index) => (
            <section
              key={section.num}
              className="mc-mkt-section group relative overflow-hidden rounded-2xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] p-5 transition-[border-color] duration-300 hover:border-white/22 sm:p-6"
              style={{ animationDelay: `${0.28 + index * 0.1}s` }}
            >
              <div className="flex gap-4 sm:gap-5">
                <span
                  className="mc-mkt-num shrink-0 pt-0.5 font-mono text-sm font-medium"
                  aria-hidden
                >
                  {section.num}
                </span>
                <div className="min-w-0 space-y-2">
                  <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                    {section.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-white/55">
                    {section.body}
                  </p>
                </div>
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-[color-mix(in_oklch,var(--brand)_18%,transparent)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
            </section>
          ))}
        </div>

        <MarketingTourNav current="/privacy" />
      </article>
    </MarketingShell>
  );
}
