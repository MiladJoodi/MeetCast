import type { Metadata } from "next";
import Link from "next/link";

import { MarketingShell } from "@/components/layout/marketing-shell";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for MeetCast.",
};

export default function TermsPage() {
  return (
    <MarketingShell className="py-14 sm:py-16">
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-white/50">Legal</p>
          <h1 className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold tracking-[-0.04em] text-white">
            Terms
          </h1>
          <p className="text-sm text-white/50">
            Last updated September 24, 2026. By using MeetCast you agree to
            these terms.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-white/55">
          <h2 className="text-base font-semibold text-white">The service</h2>
          <p>
            MeetCast lets you create time-bounded meeting rooms, share invites,
            and join over the web. Features and capacity depend on your plan.
            We may change or discontinue features with reasonable notice when
            practical.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-white/55">
          <h2 className="text-base font-semibold text-white">
            Your responsibilities
          </h2>
          <p>
            Keep your account secure. Only invite people you intend to admit.
            Do not use MeetCast for unlawful activity, harassment, or to bypass
            access controls on private rooms. You are responsible for content
            and conduct in rooms you host.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-white/55">
          <h2 className="text-base font-semibold text-white">
            Availability and liability
          </h2>
          <p>
            We aim for reliable uptime but do not guarantee uninterrupted
            service. To the extent allowed by law, MeetCast is provided as-is,
            and we are not liable for indirect or consequential damages arising
            from use of the product. Questions:{" "}
            <Link
              href="/contact"
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              contact us
            </Link>
            .
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
