# MeetCast

Reliable real-time video meetings and webinars (up to 50 participants per room).

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Neon PostgreSQL + Drizzle ORM
- Self-hosted LiveKit (WebRTC SFU)
- pnpm

Authentication uses Argon2id password hashing and server-side database sessions
(httpOnly cookies). Guests join via invite links with signed cookies. LiveKit
handles media after **server-issued** short-lived tokens.

## Prerequisites

- Node.js 20+
- pnpm 9+ (repo pin: see `packageManager` in `package.json`)
- Neon PostgreSQL database
- LiveKit server (local for development; VPS + WSS for production)

## Local setup (verified workflow)

```bash
pnpm install
cp .env.example .env.local
```

Set at least:

- `DATABASE_URL` — Neon pooled connection string
- `AUTH_SECRET` — long random string (`openssl rand -base64 32`)
- `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`

Then:

```bash
pnpm db:migrate
pnpm dev
```

### Local LiveKit

1. Run a local LiveKit server ([local docs](https://docs.livekit.io/home/self-hosting/local/)).
2. Typical development values:

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

3. Register/login → create a room → open `/room/[roomId]`.
4. Use a second browser/profile for multi-participant and guest invite tests.

**Never** put `LIVEKIT_API_SECRET`, `AUTH_SECRET`, or `DATABASE_URL` in
`NEXT_PUBLIC_*` variables or client code.

## Scripts

```bash
pnpm dev          # development server
pnpm lint
pnpm typecheck
pnpm test         # unit tests (authz/protocol/capacity)
pnpm build
pnpm start        # production Node server (after build)
pnpm db:generate  # generate SQL migrations from schema
pnpm db:migrate   # apply migrations to DATABASE_URL
pnpm db:studio    # Drizzle Studio
pnpm db:check     # validate migration journal
```

## Database migrations (production-safe)

Migrations live in `drizzle/` and are applied with Drizzle Kit against
`DATABASE_URL`.

**Safe workflow (do not reset production data):**

1. Ensure `DATABASE_URL` points at the intended database (Neon console).
2. Review pending SQL under `drizzle/*.sql`.
3. Apply:

```bash
pnpm db:migrate
```

4. Confirm with `pnpm db:check` if needed.

Do **not** run destructive reset/drop commands against production.
`pnpm db:generate` only creates new migration files from schema changes; review
them before applying.

## Production architecture

```
Browser ──HTTPS──► Next.js app (Node)
                      │
                      ├──► Neon PostgreSQL (DATABASE_URL)
                      │
                      └──► issues LiveKit JWT (LIVEKIT_API_KEY/SECRET)
Browser ──WSS/WebRTC──► LiveKit SFU on VPS (LIVEKIT_URL)
```

Moving from local `ws://localhost:7880` to production requires **env changes
only** (`LIVEKIT_URL=wss://…`). No application rewrite.

## Production deployment guide

### 1. Requirements

- Host for the Next.js app (Node 20+ capable, or equivalent)
- Neon project + pooled `DATABASE_URL`
- VPS (or equivalent) for self-hosted LiveKit
- Domains/TLS certificates for the app and LiveKit (HTTPS + WSS)

### 2. Environment variables

Set on the **server only** (see `.env.example`):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon pooled URL; never public |
| `AUTH_SECRET` | ≥32 chars in production runtime |
| `ADMIN_EMAILS` | Optional comma-separated emails auto-promoted to admin |
| `LIVEKIT_URL` | Production must be `wss://` (or `https://`) |
| `LIVEKIT_API_KEY` | From LiveKit server config |
| `LIVEKIT_API_SECRET` | Strong secret; not `secret`/`dev` defaults |
| `NEXT_PUBLIC_APP_URL` | Optional absolute origin for invite links |

Runtime production checks reject weak LiveKit secrets and non-`wss` URLs when
the server actually runs (`NODE_ENV=production`).

### 3. Neon database

1. Create a Neon project.
2. Copy the **pooled** connection string into `DATABASE_URL`.
3. Run `pnpm db:migrate` from a trusted machine/CI with that URL.

### 4. Drizzle migration

```bash
pnpm db:migrate
```

Verified locally against Neon-compatible Postgres when `DATABASE_URL` is set.
**Production migrate against your live Neon DB is expected configuration — run
only with intentional credentials.**

### 5. Next.js build / start

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

Bind/reverse-proxy `pnpm start` behind HTTPS (nginx, Caddy, cloud load balancer).

### 6. LiveKit VPS overview (expected configuration — not deployed by this repo)

Typical self-hosted setup:

- Install LiveKit server on a VPS ([self-hosting docs](https://docs.livekit.io/home/self-hosting/)).
- Point a subdomain (e.g. `livekit.example.com`) at the VPS.
- Terminate TLS so clients use `wss://livekit.example.com`.
- Configure API key + secret; put the same values in the Next.js env.
- Open required UDP/TCP ports for WebRTC (see LiveKit firewall docs).
- Prefer synchronized system time (NTP) on app + LiveKit hosts (JWT/`nbf`/`exp`).
- For restrictive NATs, plan **TURN** (LiveKit TURN or coturn) — often required
  for reliable real-world connectivity.

This repository does **not** provision the VPS. Treat the above as the expected
production checklist, not a verified deployment log.

### 7. HTTPS / WSS

- App origin: `https://…`
- LiveKit: `wss://…`
- Cookies use `Secure` when `NODE_ENV=production`.

### 8. Domain configuration

- App DNS → Next.js host / CDN
- LiveKit DNS → VPS
- Set `NEXT_PUBLIC_APP_URL` to the public app origin so invite links are absolute

### 9. Security checklist

See **[docs/production-security.md](docs/production-security.md)** for the full
production security checklist (env, HTTPS, cookies, LiveKit, rate limits, HSTS).

Quick list:

- [ ] No secrets in `NEXT_PUBLIC_*` or client bundles
- [ ] Strong `AUTH_SECRET` and LiveKit API secret
- [ ] `LIVEKIT_URL` is `wss://` in production (also set at build for CSP)
- [ ] TLS on app and LiveKit
- [ ] Migrations reviewed before apply
- [ ] `/api/health` monitored without exposing internals
- [ ] Server logs do not include passwords, tokens, or DB URLs (logger redacts common keys)
- [ ] Reverse proxy sets trusted `X-Forwarded-For` / `X-Real-IP` for rate limits

### 10. Post-deployment verification

1. `GET /api/health` → `{ status: "ok" }`
2. Register / login / logout
3. Create room, join, leave
4. Guest invite join
5. Camera / microphone / screen share (with LiveKit up)
6. Chat / raise hand / reactions
7. Host/moderator mute, disable camera, remove
8. Second participant reconnect after brief network interruption

## Health endpoint

`GET /api/health` — checks database connectivity. Returns only safe
`ok` / `degraded` status (no credentials or env dumps).

## Security headers

`next.config.ts` sets:

- `Content-Security-Policy` (production `connect-src` tightened to LiveKit origin when `LIVEKIT_URL` is set at build)
- `Strict-Transport-Security` in production
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy` for camera/microphone/display-capture
- `poweredByHeader: false`

Details: [docs/production-security.md](docs/production-security.md).

## Capacity note

Soft capacity uses LiveKit `listParticipants` before token issue; concurrent
joins can race. LiveKit room `maxParticipants` (default product target **50**)
is the hard SFU bound. This is **not** a distributed lock.

## What was verified locally vs not yet tested

| Area | Status |
|------|--------|
| `pnpm lint` / `typecheck` / `test` / `build` | Run in this repo |
| Neon migrations via `pnpm db:migrate` | Supported when `DATABASE_URL` is set |
| Full multi-user media E2E | Requires running LiveKit — may be unavailable in a given environment |
| Production VPS / TURN / real NAT | **Not deployed or load-tested by this phase** |
| Sustained 50-participant load | **Not benchmarked** |

## Known production limitations

- No Redis / secondary realtime bus (by design)
- Capacity soft-check is racy under burst joins (SFU hard limit remains)
- Ending/deleting a room in Postgres does not instantly force-disconnect LiveKit peers
- Strictest CSP may need per-environment `connect-src` allowlists
- TURN and large-scale load require real infrastructure testing
