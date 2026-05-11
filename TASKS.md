# El'Mariam Rewrite — Task Tracker

> Each task maps 1:1 to a part in REWRITE_SPEC.md. Complete them in order.
> Mark `[x]` only after the code is committed and working.

## Phase 1: Foundation

- [x] **Task 1** — Monorepo scaffold (Part 2)
  - pnpm-workspace.yaml, turbo.json, root package.json, tsconfig presets
  - Empty app/service/package directories with placeholder package.json files

- [x] **Task 2** — Mongoose schemas & connection (Part 3: packages/db)
  - All 11 models: User, Customer, RoomType, Room, Booking, Invoice, Drink, BarPurchase, BarSale, MenuItem, RestaurantOrder
  - Connection helper, barrel exports, @elmariam/db package.json

- [x] **Task 3** — Auth package & OpenAuth server (Part 4)
  - infra/openauth: subjects.ts, index.ts (Bun entry), Dockerfile
  - packages/auth: verify.ts, middleware.ts (requireAuth, requireReceptionist, requireBarista, requireWaiter, requireAdmin), barrel exports

- [x] **Task 4** — Queue package (Part 5: packages/queue)
  - RabbitMQConfig class with retry, rabbitMQEnvFromProcess helper

## Phase 2: Backend Services

- [x] **Task 5** — Hotel service (Part 6)
  - 17 Express endpoints, booking creation flow (14 steps), getDatesInRange, M-Pesa publish, SMS publish
  - Uses @elmariam/db, @elmariam/auth, @elmariam/queue
  - Dockerfile

- [x] **Task 6** — Bar service (Part 7)
  - 11 Express endpoints, Multer+MinIO image upload, per-unit price calc, multi-item checkout with stock validation
  - Fix fetchBarSale bug (saleID → salesId)
  - Dockerfile

- [x] **Task 7** — Restaurant service (Part 8)
  - 11 Express endpoints (NEW), menu CRUD, order lifecycle (pending→preparing→ready→served)
  - Dockerfile

- [x] **Task 8** — Checkout service (Part 9)
  - Hono/Bun, IntaSend STK push consumer on "mpesa" queue
  - Uses @elmariam/queue
  - Dockerfile

- [x] **Task 9** — SMS service (Part 10)
  - UjumbeSMS consumer on "sms" queue
  - Uses @elmariam/queue
  - Dockerfile

- [x] **Task 10** — SMTP service (Part 11)
  - Gmail OAuth2 + Nodemailer + Handlebars consumer on "mails" queue
  - Uses @elmariam/queue
  - Dockerfile

## Phase 3: Gateway & Infrastructure

- [ ] **Task 11** — KrakenD gateway config (Part 12)
  - krakend.json with all 35+ endpoints
  - JWT validator pointing to OpenAuth JWKS
  - propagate_claims with dot notation, input_headers synced
  - 2 public unauthenticated endpoints
  - Dockerfile

- [ ] **Task 12** — Docker Compose & Traefik (Part 16)
  - docker-compose.yml with all 14 services
  - Traefik labels, volumes, network
  - .env.sample with all variables

- [ ] **Task 13** — Justfile (Part 17)
  - Dev, docker, database, utility commands

## Phase 4: Frontend Apps

- [ ] **Task 14** — SvelteKit Admin app (Part 13)
  - 14 pages, remote functions (hotel.remote.ts, bar.remote.ts, restaurant.remote.ts, users.remote.ts, analytics.remote.ts)
  - OpenAuth PKCE login, cookie-based token storage
  - shadcn-svelte components
  - Dockerfile

- [ ] **Task 15** — SvelteKit Staff app (Part 14)
  - Role-based redirect (receptionist/barista/waiter workspaces)
  - Receptionist: 8 pages, Barista: 7 pages, Waiter: 5 pages
  - Remote functions per workspace
  - Dockerfile

- [ ] **Task 16** — SvelteKit Website (Part 15)
  - 5 public pages (SSR via +page.server.ts for public endpoints)
  - 7 customer self-service pages behind auth
  - OpenAuth PKCE login for customers
  - Dockerfile

## Phase 5: Finalization

- [ ] **Task 17** — Migration tooling (Part 18)
  - Staff role migration script (staff → receptionist/barista/waiter)
  - OpenAuth user registration migration script
  - Migration README

- [ ] **Task 18** — Integration smoke test
  - docker compose up builds and starts all 14 services
  - KrakenD routes resolve to correct backends
  - OpenAuth issues tokens, KrakenD validates them
  - At least one end-to-end flow works (e.g. login → create customer → create booking)
