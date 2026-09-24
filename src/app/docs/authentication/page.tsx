import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsAuthPage() {
  return (
    <DocsPage
      title="Authentication"
      description="MeetCast uses Argon2id passwords, database sessions in httpOnly cookies, optional Resend mail, and signed guest cookies for public rooms."
    >
      <section className="space-y-3">
        <h2>Registration and login</h2>
        <p>
          Register creates a user on the Free plan, hashes the password with
          Argon2id, and creates a session. After register you land on{" "}
          <code>/register/done</code>. Login always works even if email is not
          verified.
        </p>
        <p>
          Session token is opaque; only a SHA-256 hash is stored in{" "}
          <code>sessions</code>. Cookie name: <code>meetcast_session</code>{" "}
          (httpOnly, SameSite=Lax, Secure in production).
        </p>
      </section>

      <section className="space-y-3">
        <h2>Email verification (soft)</h2>
        <p>
          MeetCast can send a confirmation link via Resend when{" "}
          <code>RESEND_API_KEY</code> is set. Verification sets{" "}
          <code>emailVerifiedAt</code>. It does <strong>not</strong> block
          sign-in or room use. If Resend is unset, registration still succeeds
          and the UI explains that mail was not sent.
        </p>
        <DocsCallout title="Dev fallback">
          Outside production, when mail is not delivered, password-reset /
          verify flows may show the action link in the UI so you can test
          without SMTP.
        </DocsCallout>
      </section>

      <section className="space-y-3">
        <h2>Password reset</h2>
        <p>
          <code>/forgot-password</code> creates a one-time token (hash stored
          in <code>auth_tokens</code>, type <code>password_reset</code>). The
          email contains a link to <code>/reset-password</code>. Tokens expire
          (about one hour for reset; verify tokens last longer). Used tokens
          cannot be reused.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Settings</h2>
        <ul>
          <li>Profile name</li>
          <li>Password change (rate-limited)</li>
          <li>Active sessions list + revoke</li>
          <li>Accent palette</li>
          <li>Account delete (rate-limited)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Guests</h2>
        <p>
          Guests join <strong>public</strong> rooms via invite code. MeetCast
          sets an HMAC-signed <code>meetcast_guest</code> cookie scoped to the
          room and capped by the meeting end time. Guests have no{" "}
          <code>users</code> row. Private rooms reject guest join — login with
          an allowlisted account email is required.
        </p>
        <CodeBlock
          language="text"
          code={`Public room + invite → guest cookie → LiveKit token (guest:{roomId}:{guestId})
Private room → must be logged in → session email on allowlist → LiveKit token (user:{uuid})`}
        />
      </section>

      <section className="space-y-3">
        <h2>What is not built</h2>
        <ul>
          <li>OAuth / social login</li>
          <li>Mandatory verified-email gate</li>
          <li>Invitation emails or in-app notification inbox</li>
        </ul>
      </section>
    </DocsPage>
  );
}
