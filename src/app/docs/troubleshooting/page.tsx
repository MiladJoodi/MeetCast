import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsTroubleshootingPage() {
  return (
    <DocsPage
      title="Troubleshooting"
      description="Problems that show up often when running MeetCast locally."
    >
      <section className="space-y-3">
        <h2>Database connection failed</h2>
        <ul>
          <li>
            Confirm <code>DATABASE_URL</code> in <code>.env.local</code> (Neon:
            use the pooled string).
          </li>
          <li>Check the database is up and IP allowlisting (if any) allows you.</li>
          <li>
            Run <code>pnpm db:migrate</code> so required tables exist.
          </li>
          <li>
            Hit <code>GET /api/health</code> — degraded usually means DB.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>LiveKit connection failed</h2>
        <ul>
          <li>
            <code>LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code>,{" "}
            <code>LIVEKIT_API_SECRET</code> must match the LiveKit server.
          </li>
          <li>Local server actually listening (often port 7880).</li>
          <li>
            Browser can reach that URL (localhost vs remote machine; mixed
            content if the app is HTTPS and LiveKit is <code>ws://</code>).
          </li>
          <li>
            Token route returns an error — check server logs for auth,
            schedule, visibility, or capacity failures.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Camera or microphone does not work</h2>
        <ul>
          <li>Browser permission prompt denied or blocked for the origin</li>
          <li>
            Some browsers require a secure context (HTTPS or localhost) for
            media
          </li>
          <li>Another app holding the device exclusively</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Cannot join a private room</h2>
        <ul>
          <li>You must be logged in (guests are blocked).</li>
          <li>
            Session email must match an allowlist entry (normalized). Host is
            always allowed.
          </li>
          <li>Meeting must still be inside its schedule window.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Auth email never arrives</h2>
        <p>
          Set <code>RESEND_API_KEY</code> (and preferably{" "}
          <code>RESEND_FROM_EMAIL</code> on a verified domain). Without the
          key, MeetCast skips sending on purpose. Outside production, look for
          the fallback action link in the UI when mail was not delivered.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Payment does not work</h2>
        <ul>
          <li>
            Zero-price plans should fulfill without a gateway — check order
            status on <code>/billing</code>.
          </li>
          <li>
            Non-zero amounts need <code>ZARINPAL_MERCHANT_ID</code> (or mock in
            non-production).
          </li>
          <li>
            <code>PAYMENT_PROVIDER</code> force modes: <code>auto</code>,{" "}
            <code>zarinpal</code>, <code>mock</code>.
          </li>
          <li>
            Callback alone is not enough — server verify must succeed before
            fulfill.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Admin panel forbidden</h2>
        <p>
          Your user needs <code>role = admin</code>. Put your email in{" "}
          <code>ADMIN_EMAILS</code> and open the admin panel once so bootstrap
          can promote you (tight allowlist in production).
        </p>
      </section>

      <DocsCallout title="Still stuck?">
        <CodeBlock
          language="bash"
          code={`pnpm lint
pnpm typecheck
pnpm test`}
        />
        <p className="mt-2">
          Those catch a lot of local breakage before you dig into LiveKit or
          Neon.
        </p>
      </DocsCallout>
    </DocsPage>
  );
}
