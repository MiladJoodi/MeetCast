# Production security checklist

Concise operational checklist for deploying MeetCast. Do not put real secrets in this file.

## Required environment variables

| Variable | Requirement |
|----------|-------------|
| `DATABASE_URL` | Neon pooled Postgres URL (server-only) |
| `AUTH_SECRET` | Random secret, ≥32 characters in production |
| `LIVEKIT_URL` | Production: `wss://` (or `https://`) LiveKit host |
| `LIVEKIT_API_KEY` | From LiveKit server config |
| `LIVEKIT_API_SECRET` | Strong secret; never `secret` / `dev` defaults |
| `NEXT_PUBLIC_APP_URL` | Public HTTPS app origin (invite links) |
| `ADMIN_EMAILS` | Optional comma-separated bootstrap admin emails |
| `RESEND_API_KEY` | Optional — auth emails via Resend; app works without it |
| `RESEND_FROM_EMAIL` | Optional sender; defaults to Resend test domain |
| `ZARINPAL_MERCHANT_ID` | Server-only ZarinPal merchant ID (required for paid checkout) |
| `ZARINPAL_SANDBOX` | `true`/`false`; defaults to sandbox outside production when unset |
| `PAYMENT_PROVIDER` | Optional: `auto` \| `zarinpal` \| `mock` |

Never prefix secrets with `NEXT_PUBLIC_`. Never commit `.env.local`. Never expose `ZARINPAL_MERCHANT_ID` to the browser.

Set `LIVEKIT_URL` at **build time** so production CSP `connect-src` can include the LiveKit origin. If unset, CSP falls back to broader `https:`/`wss:`.

## HTTPS and cookies

- Serve the app only over HTTPS in production.
- Session cookie `meetcast_session` and guest cookie `meetcast_guest` are httpOnly, `SameSite=Lax`, `Secure` when `NODE_ENV=production`, path `/`.
- Guest cookies are HMAC-signed with `AUTH_SECRET` and scoped to one room + expiry capped by room end time.

## LiveKit

- Keep `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` server-side only.
- Clients receive short-lived JWTs from `POST /api/livekit/token` after application authorization.
- Participant identities: `user:{uuid}` or `guest:{roomId}:{guestId}` — never taken from the client body.
- LiveKit `roomAdmin` grant is issued only to the **host**; moderators use server RoomService APIs.

## Database

- Apply migrations with `pnpm db:migrate` against the intended Neon database.
- Review SQL under `drizzle/` before applying.
- Do not run destructive reset/drop against production.
- Neon HTTP driver has **no transactions**; capacity and rate-limit counters can soft-race under concurrency (SFU `maxParticipants` remains the hard room bound).

## Admin bootstrap

- Set `ADMIN_EMAILS` to trusted emails. Those accounts are promoted on Admin Panel access.
- Keep the allowlist tight. Last-admin demotion/deletion is blocked in application policy.

## Security headers

Configured in `next.config.ts`:

- CSP (no `unsafe-eval` removal in this phase — Next.js hydration tradeoff)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` / `frame-ancestors 'none'`
- `Permissions-Policy` for camera/mic/display-capture
- Production `Strict-Transport-Security` (HSTS)

## Rate limiting (PostgreSQL)

Table `rate_limit_events` stores hashed subject keys (no raw emails).

Approximate budgets:

| Action | Limit | Window |
|--------|-------|--------|
| Login (IP) | 20 | 15 min |
| Login (email) | 10 | 15 min |
| Register (IP) | 5 | 1 hour |
| Guest join (IP) | 30 | 15 min |
| LiveKit token (IP) | 120 | 1 min |
| Password change / account delete | 5 | 15 min |
| Admin mutations | 60 | 1 min |
| Checkout (user) | 10 | 15 min |

**Limitations:** soft races under concurrency; IP trust depends on reverse-proxy `X-Forwarded-For` / `X-Real-IP`; not a global edge limiter; not permanent account lockouts.

## Payments (ZarinPal)

- Create payment and verify payment only on the server via `PaymentProvider`.
- Order amounts always come from the `plans` / `orders` rows — never from the client.
- Browser callback (`GET /api/payment/callback`) is untrusted until server-to-server verify succeeds.
- Plan assignment runs only through idempotent `fulfillPaidOrder` after verification.
- There is no admin “mark as paid” path.
- **Development:** when `ZARINPAL_MERCHANT_ID` is unset, MeetCast uses an in-app simulated gateway at `/billing/pay/[orderId]` (`PAYMENT_PROVIDER=mock` forces it). Production never falls back to mock unless `PAYMENT_PROVIDER=mock` is set explicitly.

## CSRF

- Server Actions: Next.js Origin vs Host check + SameSite cookies.
- Cookie-authenticated JSON APIs (`/api/livekit/token`, moderation, member role): additional same-origin Origin/Referer check.

## Backup and migration

- Use Neon backups / PITR for the database.
- Keep `AUTH_SECRET` and LiveKit secrets in a secret manager; rotating `AUTH_SECRET` invalidates guest cookies and requires coordinated redeploy.
- After schema changes: migrate → deploy app that expects the new schema.

## Health

`GET /api/health` returns only `ok`/`degraded` and database check status. Prefer restricting public access at the reverse proxy if desired.
