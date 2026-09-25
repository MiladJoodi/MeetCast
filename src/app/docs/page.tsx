import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Radio, Wrench } from "lucide-react";

import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

const START = [
  {
    href: "/docs/getting-started",
    label: "Getting started",
    blurb: "Install, env, migrate, run",
    icon: BookOpen,
  },
  {
    href: "/docs/architecture",
    label: "Architecture",
    blurb: "How the pieces connect",
    icon: Layers,
  },
  {
    href: "/docs/meetings",
    label: "Meetings",
    blurb: "Public/private rooms & invites",
    icon: Radio,
  },
  {
    href: "/docs/troubleshooting",
    label: "Troubleshooting",
    blurb: "Common local issues",
    icon: Wrench,
  },
] as const;

export default function DocsOverviewPage() {
  return (
    <DocsPage
      title="MeetCast docs"
      description="This is the in-app guide for running and working on MeetCast. It mirrors what the code actually does — not a roadmap."
    >
      <section className="space-y-3">
        <h2>What MeetCast is</h2>
        <p>
          MeetCast is a video meeting app. You create a room with a start and
          end time, share an invite link, and people join with camera, mic,
          screen share, chat, and basic moderation. Plans control how many
          people can be in a room and how long a meeting may last.
        </p>
        <p>
          The web app is Next.js. Media goes through LiveKit. Persistent data
          (users, rooms, plans, orders) lives in PostgreSQL via Drizzle.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Start here</h2>
        <div className="not-prose grid gap-3 sm:grid-cols-2">
          {START.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="mc-mkt-card group flex flex-col gap-3 rounded-xl border border-white/12 bg-[color-mix(in_oklch,var(--room-chrome)_88%,black)] p-4 no-underline!"
                style={{ animationDelay: `${0.2 + index * 0.06}s` }}
              >
                <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition-colors group-hover:border-white/20 group-hover:text-white">
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="space-y-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold tracking-[-0.02em] text-white">
                    {item.label}
                    <ArrowRight
                      className="size-3.5 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
                      aria-hidden
                    />
                  </span>
                  <span className="block text-xs leading-relaxed text-white/45">
                    {item.blurb}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2>Repo docs</h2>
        <p>
          The GitHub README covers the same topics for people who open the
          repository first. Production security checklist lives in the repo at{" "}
          <code>docs/production-security.md</code>.
        </p>
        <CodeBlock
          language="bash"
          code={`pnpm install
cp .env.example .env.local
# fill DATABASE_URL, AUTH_SECRET, LIVEKIT_*
pnpm db:migrate
pnpm dev`}
        />
      </section>

      <DocsCallout title="Honesty rule">
        If something is not implemented (for example invitation emails, Redis,
        or a deployed LiveKit VPS in this repo), the docs say so. Do not treat
        “future deployment” sections as a live production setup.
      </DocsCallout>
    </DocsPage>
  );
}
