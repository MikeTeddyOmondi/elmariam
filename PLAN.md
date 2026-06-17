# Plan: Simplified Direct-DB Stack (`feat/simplifying-stack`)

## Problem

The `rewrite` branch routes all app logic through a multi-hop chain:

```
SvelteKit remote function → apiFetch → KrakenD gateway → Express service → MongoDB
```

This causes two concrete problems:

1. **Error messages are lost.** When Mongoose throws `E11000 duplicate key`, KrakenD propagates it as a 500, `apiFetch` throws a plain `Error`, and SvelteKit's RPC wraps it as a 200 with an error payload. Chrome network tab shows 200. Toast messages show generic text or nothing.

2. **Operational complexity.** Every new field or query requires changes in three layers: the service route, the KrakenD endpoint config, and the remote function.

## Solution

Replace the multi-hop chain with direct Mongoose calls from SvelteKit remote functions, using `better-result` for structured typed error handling.

```
Browser → SvelteKit remote function → packages/db/src/operations/ → MongoDB
```

External side effects (M-Pesa, SMS, email) are published to RabbitMQ queues and consumed by the new consolidated `services/integrations`.

The gateway and legacy services are **not deleted** — they remain on the `rewrite` branch as a reference.

---

## Architecture Changes

### DB Operations Layer (`packages/db/src/operations/`)

Each domain has a typed operations file returning `Result<T, DomainError>`:

- `hotel.ts` — customers, bookings, rooms, room types, invoices
- `bar.ts` — drinks, purchases, sales
- `restaurant.ts` — menu items, orders
- `users.ts` — system users

### Domain Errors (`packages/db/src/errors/`)

`TaggedError` subclasses per domain. Known error codes (e.g. `E11000`) map to specific error classes with user-readable messages. Unknown errors fall back to a `*DatabaseError`.

### Remote Functions

All 10 remote files rewritten to import from `@elmariam/db` operations instead of calling `apiFetch`. The `unwrap` helper converts `Result<T, E>` to either the value or a thrown `Error` with `e.message`.

### DB Connection

`connectDB` is called once per Node process via a module-level boolean guard in each app's `hooks.server.ts`. The `sequence` helper chains `dbHandle` and `authHandle`.

### `services/integrations`

Single Express service (port 8010) replacing three separate services (`checkout`, `sms`, `smtp`). Three RabbitMQ consumers handle mpesa, sms, and mails queues respectively.

### Single `MONGODB_URL`

All apps and services use `MONGODB_URL=mongodb://mongo:27017/elmariam`. The `x-common-env` YAML anchor in `docker-compose.yml` distributes it to every container.

---

## Files Changed

| Path | Change |
|------|--------|
| `packages/db/src/errors/` (4 files) | Created — domain error classes |
| `packages/db/src/operations/` (5 files) | Created — typed DB operation functions |
| `packages/db/src/index.ts` | Updated — exports errors + operations |
| `packages/db/package.json` | Updated — added `better-result` |
| `apps/*/src/hooks.server.ts` (3 files) | Updated — DB connection singleton + sequence |
| `apps/*/src/lib/remote/*.remote.ts` (10 files) | Rewritten — direct DB ops, no apiFetch |
| `apps/*/package.json` (3 files) | Updated — added `@elmariam/db` workspace dep |
| `services/integrations/` | Created — consolidated integrations service |
| `docker-compose.yml` | Updated — YAML anchor, integrations service, apps depend on mongo |
| `.env.sample` | Updated — added `MONGODB_URL` |
| `.github/workflows/ci.yml` | Created — typecheck + build on push/PR |
| `.github/workflows/release.yml` | Created — Docker matrix build + GitHub Release on v* tags |
| `docs/ERROR_HANDLING.md` | Created |
| `CONTRIBUTING.md` | Created |
| `README.md` | Created |
| `PLAN.md` | Created (this file) |
| `BACKLOG.md` | Created |
| `CHANGELOG.md` | Created |

---

## Services: What Runs vs What's Bypassed

| Service | Status |
|---------|--------|
| `infra/openauth` | Running — auth server unchanged |
| `services/integrations` | Running — new consolidated service |
| `services/hotel` | Bypassed (docker profile: `legacy`) |
| `services/bar` | Bypassed (docker profile: `legacy`) |
| `services/restaurant` | Bypassed (docker profile: `legacy`) |
| `infra/gateway` (KrakenD) | Bypassed (docker profile: `legacy`) |

---

## Verification Steps

1. `pnpm install` — resolves workspace links
2. `pnpm --filter @elmariam/db build` — clean TypeScript compile
3. `docker compose up -d mongo openauth rabbitmq staff admin website` — apps start without gateway
4. Create duplicate customer → toast shows exact domain error message
5. Chrome network tab shows correct error state (not false 200)
