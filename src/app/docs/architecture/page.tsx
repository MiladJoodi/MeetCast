import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsArchitecturePage() {
  return (
    <DocsPage
      title="Architecture"
      description="MeetCast splits responsibilities: Next.js owns auth, access control, and tokens; PostgreSQL stores durable data; LiveKit carries media and in-meeting signals."
    >
      <section className="space-y-3">
        <h2>Big picture</h2>
        <CodeBlock
          language="text"
          code={`Browser
   │
   ├── Next.js (UI, Server Actions, API routes)
   │      ├── PostgreSQL (Neon + Drizzle)
   │      └── issues short-lived LiveKit JWTs
   │
   └── LiveKit (audio, video, screen share, data channel)`}
        />
        <p>
          LiveKit is not the application database. When a meeting ends in
          Postgres, peers are not force-disconnected from LiveKit in the same
          instant — token expiry and client leave handle the rest.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Next.js</h2>
        <p>Handles:</p>
        <ul>
          <li>Registration, login, sessions, password reset, soft email verify</li>
          <li>Room create/edit, schedule windows, visibility, allowlists</li>
          <li>Plan limits and checkout/order fulfillment</li>
          <li>Admin panel actions and audit logs</li>
          <li>
            <code>POST /api/livekit/token</code> after authorization
          </li>
          <li>Moderation APIs (mute, camera off, remove, role changes)</li>
        </ul>
        <p>
          There is no <code>middleware.ts</code> in this repo. Access checks
          happen in Server Actions, route handlers, and page loaders.
        </p>
      </section>

      <section className="space-y-3">
        <h2>PostgreSQL</h2>
        <p>Stores users, sessions, auth tokens, rooms, members, allowed emails,
          revoked guests, plans, orders, rate-limit events, and admin audit
          logs. Schema: <code>src/db/schema.ts</code>. Migrations:{" "}
          <code>drizzle/</code>.</p>
      </section>

      <section className="space-y-3">
        <h2>LiveKit</h2>
        <p>
          The browser connects to <code>LIVEKIT_URL</code> with a JWT minted on
          the server. Chat, raise hand, and reactions use a LiveKit data channel
          topic (see <code>src/lib/collaboration/protocol.ts</code>) — there is
          no Socket.IO server.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Why these choices</h2>
        <h3>Why LiveKit?</h3>
        <p>
          Building a reliable SFU, signaling, and reconnect story from scratch
          is a product of its own. MeetCast uses LiveKit for media and keeps
          authorization in Next.js.
        </p>
        <h3>Why PostgreSQL + Drizzle?</h3>
        <p>
          Rooms, memberships, plans, and orders need durable storage and
          migrations. Drizzle maps TypeScript schema to SQL under{" "}
          <code>drizzle/</code>. Neon’s HTTP driver is used — no multi-statement
          transactions — so some counters (capacity, rate limits) can soft-race
          under burst load.
        </p>
        <h3>Why no Redis?</h3>
        <p>
          Sessions and rate limits live in Postgres. That keeps local setup
          smaller. It is not a global edge rate limiter.
        </p>
        <h3>Why no raw WebRTC in app code?</h3>
        <p>
          The meeting UI uses LiveKit client SDKs. MeetCast never ships{" "}
          <code>LIVEKIT_API_SECRET</code> to the browser.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Project layout</h2>
        <CodeBlock
          language="text"
          code={`src/
├── app/           # routes, Server Actions, API handlers
├── components/    # UI (meeting, rooms, billing, admin, docs…)
├── db/            # Drizzle schema + client
└── lib/           # auth, rooms, livekit, payments, security
drizzle/           # SQL migrations
docs/              # repo markdown (e.g. production-security)`}
        />
      </section>

      <section className="space-y-3">
        <h2>Environment variables</h2>
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>DATABASE_URL</code>
              </td>
              <td>Yes</td>
              <td>Postgres connection</td>
            </tr>
            <tr>
              <td>
                <code>AUTH_SECRET</code>
              </td>
              <td>Yes</td>
              <td>Session + guest HMAC</td>
            </tr>
            <tr>
              <td>
                <code>LIVEKIT_URL</code>
              </td>
              <td>Yes</td>
              <td>SFU WebSocket URL</td>
            </tr>
            <tr>
              <td>
                <code>LIVEKIT_API_KEY</code>
              </td>
              <td>Yes</td>
              <td>LiveKit API key</td>
            </tr>
            <tr>
              <td>
                <code>LIVEKIT_API_SECRET</code>
              </td>
              <td>Yes</td>
              <td>LiveKit API secret (server-only)</td>
            </tr>
            <tr>
              <td>
                <code>NEXT_PUBLIC_APP_URL</code>
              </td>
              <td>Prod-ish</td>
              <td>Absolute origin for invites / email links</td>
            </tr>
            <tr>
              <td>
                <code>ADMIN_EMAILS</code>
              </td>
              <td>Optional</td>
              <td>Comma-separated bootstrap admins</td>
            </tr>
            <tr>
              <td>
                <code>RESEND_API_KEY</code>
              </td>
              <td>Optional</td>
              <td>Auth emails; app works without it</td>
            </tr>
            <tr>
              <td>
                <code>RESEND_FROM_EMAIL</code>
              </td>
              <td>Optional</td>
              <td>Defaults to Resend test sender</td>
            </tr>
            <tr>
              <td>
                <code>ZARINPAL_MERCHANT_ID</code>
              </td>
              <td>Optional*</td>
              <td>Paid checkout; mock used in non-prod when unset</td>
            </tr>
            <tr>
              <td>
                <code>ZARINPAL_SANDBOX</code>
              </td>
              <td>Optional</td>
              <td>Defaults to sandbox outside production</td>
            </tr>
            <tr>
              <td>
                <code>PAYMENT_PROVIDER</code>
              </td>
              <td>Optional</td>
              <td>
                <code>auto</code> | <code>zarinpal</code> | <code>mock</code>
              </td>
            </tr>
          </tbody>
        </table>
        <DocsCallout title="Note">
          Zero-price plans fulfill without a payment gateway. Paid checkout
          needs ZarinPal (or an explicit mock in production, which is not the
          default).
        </DocsCallout>
      </section>
    </DocsPage>
  );
}
