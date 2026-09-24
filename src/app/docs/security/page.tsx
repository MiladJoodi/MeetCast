import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsSecurityPage() {
  return (
    <DocsPage
      title="Security"
      description="What MeetCast actually enforces today — not a marketing checklist."
    >
      <section className="space-y-3">
        <h2>Auth and cookies</h2>
        <ul>
          <li>Argon2id password hashing</li>
          <li>
            Database sessions; cookie <code>meetcast_session</code> httpOnly,
            SameSite=Lax, Secure in production
          </li>
          <li>
            Guest cookie <code>meetcast_guest</code> HMAC-signed with{" "}
            <code>AUTH_SECRET</code>
          </li>
          <li>Session revoke from settings; admin can revoke user sessions</li>
          <li>Password reset / verify tokens stored as hashes only</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>CSRF / origin</h2>
        <p>
          Server Actions rely on Next.js Origin vs Host checks plus SameSite
          cookies. Cookie-authenticated JSON APIs (
          <code>/api/livekit/token</code>, moderation, member role) also check
          Origin/Referer for same-origin requests.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Authorization</h2>
        <ul>
          <li>Room visibility + allowlist before token mint</li>
          <li>LiveKit identities never taken from client body</li>
          <li>
            <code>roomAdmin</code> grant only for the host; moderators use
            server RoomService
          </li>
          <li>Admin panel gated by <code>user.role === &quot;admin&quot;</code></li>
          <li>Order amounts from plan/order rows, never from the client</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Rate limiting</h2>
        <p>
          Sliding windows in Postgres table <code>rate_limit_events</code>{" "}
          (hashed bucket keys). Approximate budgets:
        </p>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Limit</th>
              <th>Window</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Login (IP)</td>
              <td>20</td>
              <td>15 min</td>
            </tr>
            <tr>
              <td>Login (email)</td>
              <td>10</td>
              <td>15 min</td>
            </tr>
            <tr>
              <td>Register (IP)</td>
              <td>5</td>
              <td>1 hour</td>
            </tr>
            <tr>
              <td>Guest join (IP)</td>
              <td>30</td>
              <td>15 min</td>
            </tr>
            <tr>
              <td>LiveKit token (IP)</td>
              <td>120</td>
              <td>1 min</td>
            </tr>
            <tr>
              <td>Forgot password (IP / email)</td>
              <td>10 / 5</td>
              <td>15 min</td>
            </tr>
            <tr>
              <td>Checkout (user)</td>
              <td>10</td>
              <td>15 min</td>
            </tr>
          </tbody>
        </table>
        <DocsCallout title="Limits of the limiter">
          Soft races under concurrency; IP trust depends on reverse-proxy
          forwarding headers; not permanent account lockouts.
        </DocsCallout>
      </section>

      <section className="space-y-3">
        <h2>Headers</h2>
        <p>
          <code>next.config.ts</code> sets CSP, nosniff, Referrer-Policy,
          X-Frame-Options / frame-ancestors, Permissions-Policy for
          camera/mic/display-capture, and HSTS in production. Set{" "}
          <code>LIVEKIT_URL</code> at build time so production CSP{" "}
          <code>connect-src</code> can include the LiveKit origin.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Repo checklist</h2>
        <p>
          Longer operational notes live in the repository markdown file{" "}
          <code>docs/production-security.md</code> (not this in-app route).
        </p>
      </section>
    </DocsPage>
  );
}
