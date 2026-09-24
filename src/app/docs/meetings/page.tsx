import { CodeBlock } from "@/components/docs/code-block";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsPage } from "@/components/docs/docs-page";

export default function DocsMeetingsPage() {
  return (
    <DocsPage
      title="Meetings"
      description="Rooms have a schedule window, an invite code, visibility (public or private), capacity, and host/moderator roles."
    >
      <section className="space-y-3">
        <h2>Creating a meeting</h2>
        <CodeBlock
          language="text"
          code={`Create room
   ↓
Validate title, type, schedule, visibility
   ↓
Check host plan limits (duration / participants)
   ↓
Insert room + host membership (+ allowlist if private)
   ↓
Ready — share invite or open /room/[roomId]`}
        />
        <p>
          Create always stores <code>type: &quot;meeting&quot;</code>. The schema
          also has a <code>webinar</code> enum value, but the create UI does not
          expose it. Status is derived against <code>startTime</code> /{" "}
          <code>endTime</code> (<code>waiting</code> / <code>active</code> /{" "}
          <code>ended</code>).
        </p>
      </section>

      <section className="space-y-3">
        <h2>Joining</h2>
        <CodeBlock
          language="text"
          code={`Open invite or room URL
   ↓
Meeting exists and not ended
   ↓
Within schedule (before endTime)
   ↓
Visibility / allowlist / guest rules
   ↓
Capacity soft-check (listParticipants)
   ↓
Mint LiveKit JWT
   ↓
Browser connects to LiveKit`}
        />
        <p>
          Soft capacity uses LiveKit <code>listParticipants</code> before token
          issue. Concurrent joins can race; LiveKit{" "}
          <code>maxParticipants</code> (product default 50) is the hard SFU
          bound.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Public vs private</h2>
        <h3>Public</h3>
        <p>
          Anyone with a valid invite can join under normal schedule and capacity
          rules — including guests (signed cookie, no account).
        </p>
        <h3>Private</h3>
        <p>
          Only authenticated users whose account email is on the room’s
          allowlist (or the host) may join. Checks are server-side against the
          session email — typing an email in the UI is not proof of access.
          Guests cannot join private rooms. Unauthorized users never receive a
          LiveKit token.
        </p>
        <DocsCallout title="No invite mail">
          Private rooms do not send invitation emails or notifications. The host
          shares the invite link out of band; access is still gated by the
          allowlist.
        </DocsCallout>
      </section>

      <section className="space-y-3">
        <h2>Schedule and end</h2>
        <p>
          Join and token mint reject at/after <code>endTime</code>. The meeting
          UI warns at 10 and 5 minutes before end. Hosts can end/delete from the
          dashboard. Ending in Postgres does not instantly kick every LiveKit
          peer.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Roles</h2>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Host</td>
              <td>
                Room owner. Gets LiveKit <code>roomAdmin</code>. Full moderation.
              </td>
            </tr>
            <tr>
              <td>Moderator</td>
              <td>
                Promoted member. Mute / camera off / remove via server RoomService
                APIs (not raw roomAdmin on the client).
              </td>
            </tr>
            <tr>
              <td>Participant</td>
              <td>Authenticated member without elevated grants.</td>
            </tr>
            <tr>
              <td>Guest</td>
              <td>Public rooms only. Identity{" "}
                <code>guest:{"{roomId}:{guestId}"}</code>.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </DocsPage>
  );
}
