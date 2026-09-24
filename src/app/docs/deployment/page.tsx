import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsDeploymentPage() {
  return (
    <DocsPage
      title="Deployment"
      description="What you need for a real deployment later. MeetCast does not currently ship a VPS, custom domain, or production LiveKit install in this repo."
    >
      <section className="space-y-3">
        <h2>Pieces</h2>
        <CodeBlock
          language="text"
          code={`MeetCast application (Next.js)
        │
        ├── Application hosting (Node 20+)
        │
        ├── PostgreSQL (e.g. Neon)
        │
        └── LiveKit server (separate host, WSS + media ports)`}
        />
        <p>
          The app and LiveKit are separate. Changing{" "}
          <code>LIVEKIT_URL</code> from local <code>ws://</code> to production{" "}
          <code>wss://</code> is an environment change, not an app rewrite —
          but you still have to operate the LiveKit side yourself.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Application host</h2>
        <CodeBlock
          language="bash"
          code={`pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start`}
        />
        <p>
          Put the Node process behind HTTPS. Set the same env names as{" "}
          <code>.env.example</code> on the host. Prefer{" "}
          <code>NEXT_PUBLIC_APP_URL</code> for absolute invite and email links.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Database</h2>
        <ol>
          <li>Create a Postgres database (Neon pooled URL works).</li>
          <li>
            Run <code>pnpm db:migrate</code> against that{" "}
            <code>DATABASE_URL</code> from a trusted machine/CI.
          </li>
          <li>Review SQL under <code>drizzle/</code> before applying.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2>LiveKit (production)</h2>
        <p>You will need:</p>
        <ul>
          <li>A host reachable from browsers</li>
          <li>TLS so clients use <code>wss://…</code></li>
          <li>API key/secret matching the Next.js env</li>
          <li>Open UDP/TCP ports LiveKit documents for WebRTC</li>
          <li>Often TURN for hard NATs</li>
          <li>Reasonable clock sync (JWT nbf/exp)</li>
        </ul>
        <DocsCallout title="Not done by this repo" variant="warning">
          There is no VPS playbook committed as “already deployed.” Follow{" "}
          <a
            href="https://docs.livekit.io/home/self-hosting/"
            target="_blank"
            rel="noreferrer"
          >
            LiveKit self-hosting docs
          </a>{" "}
          (or LiveKit Cloud) separately.
        </DocsCallout>
      </section>

      <section className="space-y-3">
        <h2>Optional services</h2>
        <ul>
          <li>
            <strong>Resend</strong> — auth emails
          </li>
          <li>
            <strong>ZarinPal</strong> — paid checkout when prices are non-zero
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Current limitations</h2>
        <ul>
          <li>No production domain or VPS is configured in this repository</li>
          <li>No Redis / secondary realtime bus</li>
          <li>Capacity soft-check can race under burst joins</li>
          <li>
            Ending a room in Postgres does not instantly disconnect LiveKit peers
          </li>
          <li>50-participant load has not been benchmarked here</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Health</h2>
        <p>
          <code>GET /api/health</code> returns a safe <code>ok</code> /{" "}
          <code>degraded</code> payload after checking the database. Prefer
          restricting public access at the reverse proxy if you want.
        </p>
      </section>
    </DocsPage>
  );
}
