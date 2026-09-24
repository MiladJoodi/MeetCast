import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

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

      <section className="space-y-3">
        <h2>Start here</h2>
        <ul>
          <li>
            <Link href="/docs/getting-started">Getting started</Link> — install,
            env, migrate, run
          </li>
          <li>
            <Link href="/docs/architecture">Architecture</Link> — how the pieces
            connect
          </li>
          <li>
            <Link href="/docs/meetings">Meetings</Link> — public/private rooms
            and invites
          </li>
          <li>
            <Link href="/docs/troubleshooting">Troubleshooting</Link> — common
            local issues
          </li>
        </ul>
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
