# MeetCast

MeetCast is a video meeting application built with Next.js, LiveKit, PostgreSQL, and TypeScript.

You schedule a room, share an invite, and join with camera, mic, screen share, chat, and basic moderation. Plans control participant counts and meeting duration. Private rooms restrict join to allowlisted account emails.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Drizzle · Neon Postgres · LiveKit · Vitest · pnpm 12

In-app docs (after `pnpm dev`): open `/docs` on your local app.

---

## Features

### Meetings

- Create / edit rooms with a start and end time
- Public or private visibility
- Invite links (`inviteCode`)
- Allowed-email list for private rooms (no invite emails — share the link yourself)
- Participant capacity (plan-driven; SFU hard cap 50)
- Status: waiting / active / ended
- Host can end a meeting from the dashboard

### Realtime

- Camera, microphone, screen share
- Participant grid and speaking state
- Chat, raise hand, reactions (LiveKit data channel)
- Soft LiveKit token refresh before JWT expiry
- Reconnect / disconnect banner

### Roles & moderation

- Host, moderator, participant, guest (guests only on public rooms)
- Mute, disable camera, remove participant
- Moderator promote/demote

### Account

- Register / login / logout
- Database sessions (httpOnly cookie)
- Password change, session revoke, account delete
- Soft email verification (login works without verifying)
- Forgot / reset password (Resend optional)

### Plans & billing

- Free / Starter / Pro / Business (seeded in migrations; admins can edit)
- Limits: max concurrent participants, max room duration
- Checkout → order → payment → idempotent fulfill
- ZarinPal when configured; in-app mock gateway in non-production without a merchant
- Current migration sets plan prices to **0** IRR so checkout still runs without a gateway

### Admin

- Users, rooms, plans, orders, audit logs
- Bootstrap admins via `ADMIN_EMAILS`

---

## Screenshots

No screenshot assets are checked into the repo yet. When you add them, drop images under `docs/screenshots/` and link them here, for example:

```md
![Landing](docs/screenshots/landing.png)
![Dashboard](docs/screenshots/dashboard.png)
![Meeting](docs/screenshots/meeting.png)
```

Suggested captures: landing, dashboard, rooms, live meeting, plans, private room settings, admin, account settings.

---

## Tech stack

| Technology | Purpose |
| ---------- | ------- |
| Next.js 16 | App Router UI, Server Actions, API routes |
| React 19 | Application UI |
| TypeScript | Types across app and libs |
| Tailwind CSS 4 | Styling |
| PostgreSQL / Neon | Persistent data |
| Drizzle ORM | Schema + migrations |
| LiveKit | Audio, video, screen share, data channel |
| `@node-rs/argon2` | Password hashing (Argon2id) |
| Zod | Validation |
| Vitest | Unit tests |
| Resend (HTTP API) | Optional auth email |
| ZarinPal | Optional paid checkout |

---

## Architecture

```text
Browser
   │
   ├── Next.js
   │     ├── UI
   │     ├── Server Actions
   │     └── API routes
   │
   ├── PostgreSQL (users, rooms, plans, orders, …)
   │
   └── LiveKit (media + in-meeting signals)
```

**Next.js** owns authentication, room access, plan limits, billing fulfillment, admin actions, and LiveKit token minting.

**PostgreSQL** stores durable application data. LiveKit is not the database.

**LiveKit** carries AV and lightweight collaboration. Secrets (`LIVEKIT_API_SECRET`, `AUTH_SECRET`, `DATABASE_URL`) stay server-side.

There is **no** `middleware.ts`, **no** Socket.IO server, and **no** Redis in this project.

### Important decisions

| Topic | What we do |
| ----- | ---------- |
| LiveKit | SFU + SDKs instead of building WebRTC infrastructure from scratch |
| Drizzle | Typed schema → SQL migrations under `drizzle/` |
| No Socket.IO | Chat / raise hand / reactions use LiveKit data channels |
| No Redis | Sessions and rate limits in Postgres for a smaller local stack |
| Capacity | Soft check via `listParticipants` before token issue; SFU `maxParticipants` is the hard bound (races possible) |
| Meeting end | Join/token rejected at `endTime`; ending in Postgres does not instantly force-disconnect LiveKit peers |
| Tokens | Short-lived JWTs from `POST /api/livekit/token` after authz; identities `user:{uuid}` or `guest:{roomId}:{guestId}` |
| Private rooms | Session email must be on `room_allowed_emails` (host always allowed); guests blocked |

---

## Project structure

```text
src/
├── app/           # Routes, Server Actions, API handlers
├── components/    # UI (meeting, rooms, billing, admin, docs…)
├── db/            # Drizzle client + schema
└── lib/           # Auth, rooms, LiveKit, payments, security
drizzle/           # SQL migrations
docs/              # Repo markdown (e.g. production-security.md)
```

---

## Requirements

- Node.js 20+
- pnpm 12.6 (`packageManager` in `package.json`)
- PostgreSQL (Neon pooled URL is the usual setup)
- A reachable LiveKit server (local SFU or LiveKit Cloud)

This repo does **not** include a production VPS or custom domain.

---

## Local setup

```bash
git clone <repository-url>
cd meetcast
pnpm install
cp .env.example .env.local
```

Fill at least:

```env
DATABASE_URL=…
AUTH_SECRET=…          # openssl rand -base64 32
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

Then:

```bash
pnpm db:migrate
pnpm dev
```

### LiveKit locally

1. Run a local LiveKit server ([docs](https://docs.livekit.io/home/self-hosting/local/)) or use LiveKit Cloud credentials.
2. Keep API key/secret aligned with the server config.
3. Register → create a room → open `/room/[roomId]`. Use a second browser profile for guest / multi-user tests.

Never put secrets in `NEXT_PUBLIC_*` variables.

---

## Environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | Postgres connection (Neon pooled) |
| `AUTH_SECRET` | Yes | Session + guest cookie signing (≥32 chars in production) |
| `LIVEKIT_URL` | Yes | LiveKit WebSocket URL |
| `LIVEKIT_API_KEY` | Yes | LiveKit API key |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API secret (server-only) |
| `NEXT_PUBLIC_APP_URL` | Recommended in prod | Absolute app origin for invites / emails |
| `ADMIN_EMAILS` | Optional | Comma-separated bootstrap admin emails |
| `RESEND_API_KEY` | Optional | Auth email; app works without it |
| `RESEND_FROM_EMAIL` | Optional | Sender; defaults to Resend test address |
| `ZARINPAL_MERCHANT_ID` | Optional* | Paid checkout |
| `ZARINPAL_SANDBOX` | Optional | Defaults to sandbox outside production |
| `PAYMENT_PROVIDER` | Optional | `auto` \| `zarinpal` \| `mock` |

\* Non-zero prices need a provider. Zero-price plans fulfill without a gateway. In non-production, missing ZarinPal merchant → in-app mock at `/billing/pay/[orderId]`.

Full comments: [`.env.example`](.env.example).

---

## Database

```bash
pnpm db:migrate    # apply drizzle/*.sql
pnpm db:generate   # after schema edits
pnpm db:studio     # browse
pnpm db:check      # journal sanity
```

Default plans are inserted by migration (Free 5/60m, Starter 10/120m, Pro 25/240m, Business 50/unlimited duration within the app ceiling). There is no separate seed script.

Do not run destructive reset/drop against production databases.

---

## Scripts

```bash
pnpm dev          # Next.js development server
pnpm build        # production build
pnpm start        # serve production build
pnpm lint
pnpm typecheck
pnpm test         # Vitest
```

---

## How it works (short)

### Create a meeting

```text
Create room → validate → check plan limits → save room (+ allowlist) → ready
```

### Join a meeting

```text
Invite/room URL → schedule check → visibility/access → capacity → LiveKit token → connect
```

### Public vs private

- **Public:** invite link + normal schedule/capacity; guests allowed.
- **Private:** must be logged in; account email on allowlist (or host). No LiveKit token otherwise. No invitation email product.

### Billing

```text
Plans → checkout → order (amount from plan) → pay or zero-fulfill → verify → fulfillPaidOrder → plan on user
```

---

## Security (summary)

- Argon2id, httpOnly sessions, SameSite cookies
- Same-origin checks on sensitive APIs
- Postgres rate limits (login, register, guest join, tokens, checkout, …)
- Server-only LiveKit secrets; short-lived tokens after authz
- Payment amounts from DB; idempotent fulfillment
- Security headers in `next.config.ts`

Operational checklist: [`docs/production-security.md`](docs/production-security.md).

---

## Testing

Vitest covers payments, room visibility, schedule, auth email tokens, plans, admin policy helpers, security helpers, settings, and reliability/protocol pieces under `src/lib/__tests__/`.

```bash
pnpm test
```

No coverage percentage is claimed here.

---

## Current limitations

- No VPS / custom domain / production LiveKit is provisioned by this repository
- Email and paid checkout need external accounts (Resend, ZarinPal) when you want them live
- Soft capacity checks can race; SFU max remains the hard bound
- Ending a room in Postgres does not instantly disconnect LiveKit peers
- Sustained 50-participant load is not benchmarked here

---

## Future deployment (checklist, not a live install)

```text
Next.js host  +  PostgreSQL  +  LiveKit (WSS, open media ports, usually TURN)
```

```bash
pnpm install --frozen-lockfile
pnpm build && pnpm start
```

Set production env (strong `AUTH_SECRET`, `wss://` LiveKit URL, migrate DB). In-app guide: `/docs/deployment`.

---

## Health

`GET /api/health` — safe `ok` / `degraded` after a database check.

---

## Author

Built by [Milad Joodi](https://github.com/MiladJoodi) · [LinkedIn](https://www.linkedin.com/in/joodi/)
