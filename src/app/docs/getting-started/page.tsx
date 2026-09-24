import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsGettingStartedPage() {
  return (
    <DocsPage
      title="Getting started"
      description="Clone the repo, set env vars, migrate the database, point MeetCast at a LiveKit server, and run the app."
    >
      <section className="space-y-3">
        <h2>Requirements</h2>
        <ul>
          <li>Node.js 20+</li>
          <li>
            pnpm 12.6 (see <code>packageManager</code> in <code>package.json</code>
            )
          </li>
          <li>PostgreSQL (Neon pooled URL works out of the box)</li>
          <li>
            A LiveKit server you can reach (local SFU or LiveKit Cloud). This
            repo does not ship a VPS or production LiveKit install.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Install</h2>
        <CodeBlock
          language="bash"
          code={`git clone <your-fork-or-clone-url>
cd meetcast
pnpm install
cp .env.example .env.local`}
        />
      </section>

      <section className="space-y-3">
        <h2>Environment</h2>
        <p>Minimum for local development:</p>
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Required</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>DATABASE_URL</code>
              </td>
              <td>Yes</td>
              <td>Neon pooled connection string recommended</td>
            </tr>
            <tr>
              <td>
                <code>AUTH_SECRET</code>
              </td>
              <td>Yes</td>
              <td>
                Session + guest cookie signing. Generate with{" "}
                <code>openssl rand -base64 32</code>. Production requires ≥32
                chars.
              </td>
            </tr>
            <tr>
              <td>
                <code>LIVEKIT_URL</code>
              </td>
              <td>Yes</td>
              <td>
                e.g. <code>ws://localhost:7880</code> locally
              </td>
            </tr>
            <tr>
              <td>
                <code>LIVEKIT_API_KEY</code>
              </td>
              <td>Yes</td>
              <td>Must match the LiveKit server config</td>
            </tr>
            <tr>
              <td>
                <code>LIVEKIT_API_SECRET</code>
              </td>
              <td>Yes</td>
              <td>Server-only. Never put this in <code>NEXT_PUBLIC_*</code></td>
            </tr>
          </tbody>
        </table>
        <p>
          Optional: <code>ADMIN_EMAILS</code>, <code>NEXT_PUBLIC_APP_URL</code>,{" "}
          <code>RESEND_API_KEY</code> / <code>RESEND_FROM_EMAIL</code>, ZarinPal
          payment vars. Full list is on the Architecture and Security pages and
          in <code>.env.example</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Database</h2>
        <CodeBlock language="bash" code={`pnpm db:migrate`} />
        <p>
          Migrations live under <code>drizzle/</code>. There is no separate seed
          script — default plans (Free, Starter, Pro, Business) are inserted by
          migration SQL.
        </p>
        <CodeBlock
          language="bash"
          code={`pnpm db:generate   # after schema changes
pnpm db:studio     # browse tables
pnpm db:check      # validate migration journal`}
        />
      </section>

      <section className="space-y-3">
        <h2>LiveKit (local)</h2>
        <p>
          Run a local LiveKit server (see{" "}
          <a
            href="https://docs.livekit.io/home/self-hosting/local/"
            target="_blank"
            rel="noreferrer"
          >
            LiveKit local docs
          </a>
          ), or use LiveKit Cloud and paste the project URL/key/secret into{" "}
          <code>.env.local</code>. Typical local defaults:
        </p>
        <CodeBlock
          language="env"
          code={`LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret`}
        />
        <DocsCallout title="Important" variant="warning">
          Weak secrets like <code>secret</code> are fine for local only.
          Production rejects weak LiveKit secrets and non-WSS URLs at runtime.
        </DocsCallout>
      </section>

      <section className="space-y-3">
        <h2>Run</h2>
        <CodeBlock language="bash" code={`pnpm dev`} />
        <p>
          Open the app, register, create a room, join{" "}
          <code>/room/[roomId]</code>. Use a second browser profile for guest /
          multi-participant checks.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Quality commands</h2>
        <table>
          <thead>
            <tr>
              <th>Command</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>pnpm test</code>
              </td>
              <td>Vitest unit tests</td>
            </tr>
            <tr>
              <td>
                <code>pnpm lint</code>
              </td>
              <td>ESLint</td>
            </tr>
            <tr>
              <td>
                <code>pnpm typecheck</code>
              </td>
              <td>
                <code>tsc --noEmit</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>pnpm build</code>
              </td>
              <td>Production Next.js build</td>
            </tr>
            <tr>
              <td>
                <code>pnpm start</code>
              </td>
              <td>Serve the production build</td>
            </tr>
          </tbody>
        </table>
      </section>
    </DocsPage>
  );
}
