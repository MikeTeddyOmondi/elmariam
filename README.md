# Elmariam Hotel & Hospitality System

A full-stack hospitality management platform for hotel, bar, and restaurant operations.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend apps | SvelteKit (admin, staff, website) |
| Database | MongoDB via Mongoose (`@elmariam/db`) |
| Auth | OpenAuth (PKCE, JWT) |
| Messaging | RabbitMQ (`@elmariam/queue`) |
| Integrations | Express service — M-Pesa, UjumbeSMS, Gmail |
| Object storage | MinIO |
| Error handling | `better-result` (Result<T, E>) |
| Reverse proxy | Traefik |

## Services

| Service | Port | Purpose |
|---------|------|---------|
| `apps/admin` | 3000 | Admin panel — rooms, bookings, analytics |
| `apps/staff` | 3001 | Staff panel — hotel, bar, restaurant ops |
| `apps/website` | 3002 | Public site — room browsing, booking |
| `infra/openauth` | 3100 | Auth server — login, token issue |
| `services/integrations` | 8010 | M-Pesa STK push, SMS, email notifications |
| MongoDB | 27017 | Primary datastore |
| RabbitMQ | 5672 / 15672 | Message queue |
| MinIO | 9003 / 9001 | Object storage |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env vars
cp .env.sample .env
# Edit .env with your secrets

# 3. Build shared packages
pnpm --filter @elmariam/db build
pnpm --filter @elmariam/queue build

# 4. Start infrastructure
docker compose up -d mongo rabbitmq

# 5. Run apps in dev mode
pnpm --filter @elmariam/staff dev
pnpm --filter @elmariam/admin dev
pnpm --filter @elmariam/website dev
```

## Architecture

### Direct-DB Architecture (`feat/simplifying-stack`)

SvelteKit remote functions call Mongoose directly via `@elmariam/db` operations — no HTTP gateway hop:

```
Browser → SvelteKit remote function → packages/db/src/operations/ → MongoDB
```

External side effects (M-Pesa, SMS, email) are published to RabbitMQ queues and consumed by `services/integrations`.

### Branch Guide

| Branch | Architecture | Status |
|--------|-------------|--------|
| `feat/simplifying-stack` | Direct DB | Active |
| `rewrite` | KrakenD gateway + Express services | Frozen reference |

## Docs

- [CONTRIBUTING.md](CONTRIBUTING.md) — conventions for contributors
- [PLAN.md](PLAN.md) — architecture decision and implementation plan
- [BACKLOG.md](BACKLOG.md) — task backlog
- [CHANGELOG.md](CHANGELOG.md) — release history
- [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md) — `better-result` pattern guide

## Required Secrets (GitHub Actions)

| Secret | Purpose |
|--------|---------|
| `DOCKERHUB_USERNAME` | Docker Hub login |
| `DOCKERHUB_TOKEN` | Docker Hub push token |
