import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsRealtimePage() {
  return (
    <DocsPage
      title="Realtime"
      description="Audio, video, screen share, and participant state go through LiveKit. Light collaboration (chat, raise hand, reactions) uses a LiveKit data channel."
    >
      <section className="space-y-3">
        <h2>Token flow</h2>
        <CodeBlock
          language="text"
          code={`POST /api/livekit/token
   ↓
Same-origin check + rate limit
   ↓
Authorize actor (member / guest cookie)
   ↓
Schedule + visibility + capacity
   ↓
Mint short-lived JWT (TTL capped by endTime)
   ↓
Return token + LIVEKIT_URL to client`}
        />
        <p>
          Identities are set server-side: <code>user:{"{uuid}"}</code> or{" "}
          <code>guest:{"{roomId}:{guestId}"}</code>. Clients cannot pick their
          own identity in the request body.
        </p>
        <p>
          Long meetings soft-refresh the token before JWT expiry (about 90s
          early) so the connection can continue without a full remount when
          possible.
        </p>
      </section>

      <section className="space-y-3">
        <h2>In the meeting UI</h2>
        <ul>
          <li>Camera and microphone toggles</li>
          <li>Screen sharing</li>
          <li>Participant grid / screen-share stage</li>
          <li>Speaking indicators from LiveKit</li>
          <li>Chat, raise hand, emoji reactions (data channel)</li>
          <li>Connection banner for reconnect / disconnect</li>
          <li>Host/moderator mute, disable camera, remove</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Why not Socket.IO?</h2>
        <p>
          Meeting-scoped signals already ride LiveKit’s data channel. Adding a
          second realtime bus would mean another service to run and secure.
          Application events that need durability (orders, memberships) stay in
          Postgres and Server Actions.
        </p>
      </section>

      <DocsCallout title="Local vs production media">
        Local <code>ws://localhost:7880</code> is for development. Production
        needs a reachable LiveKit host on <code>wss://</code> plus TLS and
        usually TURN for restrictive NATs. This repository does not provision
        that VPS.
      </DocsCallout>
    </DocsPage>
  );
}
