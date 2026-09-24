import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How MeetCast handles account and meeting data.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell className="py-14 sm:py-16">
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-white/50">Legal</p>
          <h1 className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold tracking-[-0.04em] text-white">
            Privacy
          </h1>
          <p className="text-sm text-white/50">
            Last updated September 24, 2026. This is a short product summary,
            not a substitute for tailored legal advice.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-white/55">
          <h2 className="text-base font-semibold text-white">What we collect</h2>
          <p>
            Account details you provide (name, email, password hash), billing
            and plan records tied to your account, and room metadata (titles,
            schedules, invite codes, visibility, and guest-list emails you
            add). During a live meeting we process realtime media through our
            video provider so participants can see and hear each other.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-white/55">
          <h2 className="text-base font-semibold text-white">How we use it</h2>
          <p>
            We use this data to run MeetCast: authenticate you, enforce room
            access (including private guest lists), schedule and host meetings,
            apply plan limits, and handle support or abuse reports. We do not
            sell your personal information.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-white/55">
          <h2 className="text-base font-semibold text-white">
            Retention and control
          </h2>
          <p>
            You can update profile settings while signed in. Hosts control
            rooms they create, including guest lists and whether a room is
            public or private. If you need account deletion or a data question,
            contact us via the{" "}
            <Link
              href="/contact"
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              contact page
            </Link>
            .
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
