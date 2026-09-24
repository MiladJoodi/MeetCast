import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the MeetCast team.",
};

/** Public support inbox — keep in sync with who actually reads mail. */
const SUPPORT_EMAIL = "MiladJoodi1@gmail.com";

export default function ContactPage() {
  return (
    <MarketingShell className="max-w-lg justify-center py-14 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-white/50">Contact</p>
          <h1 className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold tracking-[-0.04em] text-white">
            We’re here if a room breaks.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/55">
            Billing questions, invite trouble, or something odd in a live
            meeting — write us and we’ll dig in. Usual reply within one
            business day.
          </p>
        </header>

        <div className="space-y-4 rounded-2xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-white/45 uppercase">
              Email
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=MeetCast%20support`}
              className="text-base font-semibold tracking-[-0.02em] text-white underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <p className="text-sm text-white/50">
            Add the room title or invite link if you have one, and the email on
            your MeetCast account. That saves a round of back-and-forth.
          </p>
        </div>

        <p className="text-sm text-white/50">
          Comparing limits first?{" "}
          <Link
            href="/plans"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            See plans
          </Link>
          .
        </p>
      </div>
    </MarketingShell>
  );
}
