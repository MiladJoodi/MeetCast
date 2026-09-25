import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingPanel } from "@/components/marketing/marketing-panel";
import { MarketingTourNav } from "@/components/marketing/marketing-tour-nav";
import { SITE_SOCIAL, SUPPORT_EMAIL } from "@/lib/site/links";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the MeetCast team.",
};

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <MarketingShell
      scrollable
      className="max-w-lg justify-center py-14 sm:py-16"
    >
      <div className="space-y-8">
        <MarketingPageHeader
          eyebrow="Support desk"
          title="We’re here if a room breaks."
          description="Billing questions, invite trouble, or something odd in a live meeting — write us and we’ll dig in. Usual reply within one business day."
        />

        <MarketingPanel index={0} className="space-y-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white">
              <Mail className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-white/45 uppercase">
                Email
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=MeetCast%20support`}
                className="group inline-flex items-center gap-1.5 text-lg font-semibold tracking-[-0.03em] text-white"
              >
                <span className="underline-offset-4 group-hover:underline">
                  {SUPPORT_EMAIL}
                </span>
                <ArrowUpRight
                  className="size-4 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                  aria-hidden
                />
              </a>
            </div>
          </div>
          <p className="border-t border-white/10 pt-4 text-sm leading-relaxed text-white/50">
            Add the room title or invite link if you have one, and the email on
            your MeetCast account. That saves a round of back-and-forth.
          </p>
        </MarketingPanel>

        <div className="mc-mkt-in-4 space-y-3">
          <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-white/45 uppercase">
            Elsewhere
          </p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={SITE_SOCIAL.github.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-mkt-card group flex items-center gap-3 rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] px-4 py-3.5"
            >
              <GitHubIcon className="size-5 text-white/70 group-hover:text-white" />
              <span className="text-sm font-medium text-white">
                {SITE_SOCIAL.github.label}
              </span>
            </a>
            <a
              href={SITE_SOCIAL.linkedin.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-mkt-card group flex items-center gap-3 rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] px-4 py-3.5"
              style={{ animationDelay: "0.36s" }}
            >
              <LinkedInMark className="size-5 text-white/70 group-hover:text-white" />
              <span className="text-sm font-medium text-white">
                {SITE_SOCIAL.linkedin.label}
              </span>
            </a>
          </div>
        </div>

        <p
          className="mc-mkt-in-4 text-sm text-white/50"
          style={{ animationDelay: "0.4s" }}
        >
          Comparing limits first?{" "}
          <Link
            href="/plans"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            See plans
          </Link>
          . Building locally?{" "}
          <Link
            href="/docs"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Read the docs
          </Link>
          .
        </p>

        <MarketingTourNav current="/contact" />
      </div>
    </MarketingShell>
  );
}
