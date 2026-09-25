import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingTourNav } from "@/components/marketing/marketing-tour-nav";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for MeetCast.",
};

const SECTIONS = [
  {
    num: "01",
    title: "The service",
    body: (
      <>
        MeetCast lets you create time-bounded meeting rooms, share invites, and
        join over the web. Features and capacity depend on your plan. We may
        change or discontinue features with reasonable notice when practical.
      </>
    ),
  },
  {
    num: "02",
    title: "Your responsibilities",
    body: (
      <>
        Keep your account secure. Only invite people you intend to admit. Do not
        use MeetCast for unlawful activity, harassment, or to bypass access
        controls on private rooms. You are responsible for content and conduct
        in rooms you host.
      </>
    ),
  },
  {
    num: "03",
    title: "Availability and liability",
    body: (
      <>
        We aim for reliable uptime but do not guarantee uninterrupted service.
        To the extent allowed by law, MeetCast is provided as-is, and we are not
        liable for indirect or consequential damages arising from use of the
        product. Questions:{" "}
        <Link
          href="/contact"
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          contact us
        </Link>
        .
      </>
    ),
  },
] as const;

export default function TermsPage() {
  return (
    <MarketingShell scrollable className="py-14 sm:py-16">
      <article className="space-y-10">
        <MarketingPageHeader
          eyebrow="Legal"
          title="Terms"
          description="Last updated September 24, 2026. By using MeetCast you agree to these terms."
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
                className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-[color-mix(in_oklch,var(--live)_16%,transparent)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
            </section>
          ))}
        </div>

        <MarketingTourNav current="/terms" />
      </article>
    </MarketingShell>
  );
}
