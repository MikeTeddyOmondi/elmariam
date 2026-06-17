# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) for versioned releases. Older entries below are commit-log style from the `rewrite` branch.

---

## [Unreleased]

## [v0.1.0] — 2026-06-17 (`feat/simplifying-stack`)

### Added

- `packages/db/src/errors/` — domain `TaggedError` classes for hotel, bar, restaurant, and users
- `packages/db/src/operations/` — typed DB operation functions returning `Result<T, DomainError>` via `better-result`
- `better-result` dependency in `packages/db` for Rust-inspired typed error handling
- `services/integrations` — consolidated Express service (port 8010) replacing three separate services: M-Pesa STK push, UjumbeSMS SMS, Gmail OAuth2 email
- DB connection singleton in `hooks.server.ts` for all three apps using `sequence` from `@sveltejs/kit/hooks`
- `MONGODB_URL` as single canonical MongoDB connection string across all apps and services
- `x-common-env` and `x-rabbitmq-env` YAML anchors in `docker-compose.yml`
- Legacy services (`hotel`, `bar`, `restaurant`, `gateway`) moved to `profiles: [legacy]`
- `.github/workflows/ci.yml` — typecheck + build on push/PR (pnpm v10, Node 22)
- `.github/workflows/release.yml` — Docker matrix build + GitHub Release on `v*` tags
- `docs/ERROR_HANDLING.md`, `CONTRIBUTING.md`, `README.md`, `PLAN.md`, `BACKLOG.md`

### Changed

- All 10 remote function files rewritten to call `@elmariam/db` operations directly (no `apiFetch`)
- Apps now depend on `mongo` + `openauth` directly instead of `gateway` in docker-compose

### Fixed

- Toast error messages now show correct domain-specific text (e.g. "A customer with that id number already exists.")
- Chrome network tab no longer shows a false 200 on remote function errors
- `E11000` duplicate key errors mapped to typed `*AlreadyExistsError` classes with user-readable messages

---

## Rewrite Branch History

## [c158744] fix: resolve all KrakenD gateway issues and public/POST endpoint failures

- Removed `requireReceptionist` from `GET /rooms/types` (hotel) and `requireAuth` from `GET /menu` (restaurant) — public KrakenD endpoints can't inject auth headers, so these routes must be open at the service level
- Added `"input_body_encoding": "json"` to all POST/PUT endpoint configs in krakend.json — KrakenD v2.4+ does not forward request bodies unless this is explicitly set
- Added `"method": "POST"/"PUT"` to every backend object for mutating endpoints — without this KrakenD defaults the backend call to GET, stripping the body
- Added `x-user-id`, `x-user-email`, `x-user-type`, `X-Requested-With` to service-level CORS `allow_headers` and `expose_headers`
- Removed martian `fifo.Group` header injection from public endpoints (no longer needed)
- Rebuilt gateway Docker image — krakend.json is `COPY`'d at build time; `docker restart` alone does not pick up config changes
- Added `.http` request file with curl equivalents for all endpoints
- Added `test-api.sh` smoke test script: 19 tests pass / 0 fail / 12 skipped (Docker-internal services)

## [178f264] fix: align KrakenD JWT issuer with OpenAuth's actual iss claim

- Changed all 39 `"issuer"` values in krakend.json from the production URL to `"http://openauth:3100"` — OpenAuth derives `iss` from the request URL, which inside Docker is the container hostname
- Protected endpoints now validate JWT correctly; previously all returning 401

## [76c10b7] fix: replace deprecated checkOrigin with trustedOrigins

- Updated CSRF config in `apps/admin`, `apps/staff`, `apps/website` `svelte.config.js` from deprecated `checkOrigin: false` to `csrf: { trustedOrigins: ['*'] }`
- Resolves "Cross-site POST form submissions are forbidden" errors from SvelteKit remote functions

## [fd2c713] fix: disable SvelteKit CSRF origin check on all apps

- Initial CSRF fix using `checkOrigin: false` (later superseded by trustedOrigins approach above)

## [9557515] fix: show fallback select when room types fail to load

- Added `{:catch}` block to the `{#await roomTypes}` expression on the Add Rooms page — without it the room type `<select>` silently disappeared on API error

## [7f46db4] fix: standardise typography and theme across all admin pages

- Rewrote 6 admin pages (bookings, customers, bar-sales, restaurant-orders, room-types, users) that had raw HTML with hardcoded `<style>` blocks and `background: #fff`
- All pages now use theme-aware Tailwind: `text-foreground`, `bg-card`, `border-border`, `bg-secondary/50` table headers, `bg-X/15 text-X` status badges

## [683f6b1] feat: add chart.js analytics dashboard to admin app

- Replaced `layerchart@next` (requires Tailwind v4) with `chart.js ^4.4.0` (canvas-based, Tailwind-agnostic)
- Admin dashboard: bar chart (activity by category), doughnut (payment methods), bar chart (revenue by service)
- Added `Chart.Container` CSS-var injector component to `packages/ui`; reads HSL vars via `cssVar()` helper at runtime
- Chart instances created/destroyed via Svelte 5 `$effect` with canvas refs

## [c73bc78] feat: Task 18 — integration smoke test script

- scripts/smoke-test.sh: verifies service reachability (gateway, OpenAuth, 3 apps), public endpoints return success, protected endpoints reject 401, OpenAuth JWKS + OIDC config present
- Includes e2e flow instructions for manual token-based verification
- Run with: ./scripts/smoke-test.sh (after docker compose up -d)
- Implements: REWRITE_SPEC.md integration verification

## [77b8703] feat: Task 17 — migration tooling

- scripts/migrations/migrate-staff-roles.ts: updates userType "staff" → receptionist|barista|waiter|management; supports ROLE_MAP for per-user overrides
- scripts/migrations/migrate-openauth-users.ts: registers existing MongoDB users with OpenAuth PasswordProvider, backfills openauth_subject_id
- scripts/migrations/README.md: prerequisites, usage, env vars, order of operations
- Implements: REWRITE_SPEC.md Part 18

## [ff29fa5] feat: Task 16 — apps/website SvelteKit customer-facing website

- svelte.config.js (adapter-node, port 3002), vite.config.js, tsconfig.json
- Public pages: / (homepage), /rooms (SSR +page.server.ts → /api/public/roomtypes), /restaurant (SSR +page.server.ts → /api/public/menu), /about, /contact
- Auth: /login (PKCE), /login/callback/+page.server.ts (exchange code, set auth_token, verify userType===customer), /register
- Customer portal: /portal, /portal/bookings (list), /portal/bookings/new (create with room rates), /portal/bookings/[id] (detail), /portal/invoices, /portal/profile
- Remote functions: booking.remote.ts, account.remote.ts
- Dockerfile (port 3002)
- Implements: REWRITE_SPEC.md Part 15

## [96cdcbf] feat: Task 15 — apps/staff SvelteKit role-based staff portal

- svelte.config.js (adapter-node, port 3001), vite.config.js, tsconfig.json
- Root +page.svelte reads user_type cookie and redirects to /receptionist|/barista|/waiter
- PKCE login flow (login/+page.svelte, login/callback/+page.server.ts sets auth_token + user_type cookies)
- Receptionist workspace (8 pages): dashboard, customers (list+new), bookings (list+new), rooms, invoices
- Barista workspace (7 pages): dashboard, drinks (list+new), purchases (list+new), sales (list+new)
- Waiter workspace (5 pages): dashboard, menu, orders (list+new)
- Remote functions: hotel.remote.ts, bar.remote.ts, restaurant.remote.ts
- Dockerfile
- Implements: REWRITE_SPEC.md Part 14

## [92129f6] feat: Task 14 — apps/admin SvelteKit management portal

- svelte.config.js (adapter-node), vite.config.js (port 3000), tsconfig.json
- src/lib/server/auth.ts: requireManagement helper (verifies token + userType===management)
- Remote functions: hotel.remote.ts, bar.remote.ts, restaurant.remote.ts, users.remote.ts, analytics.remote.ts
- PKCE login flow: login/+page.svelte (initiates authorize), login/callback/+page.server.ts (exchanges code, sets auth_token cookie)
- 11 route pages: dashboard (analytics), users, customers, bookings, rooms, room-types, bar-drinks, bar-purchases, bar-sales, menu-items, restaurant-orders
- Sidebar layout (non-login routes), Dockerfile
- Implements: REWRITE_SPEC.md Part 13

## [652bf61] feat: Tasks 12-13 — docker-compose.yml (14 services), .env.sample, Justfile

- docker-compose.yml: mongo, rabbitmq, minio, reverse-proxy (Traefik), openauth, hotel, bar, restaurant, checkout, sms, smtp, gateway, admin, staff, website
- All services on elmariam-network bridge, Traefik labels for host-based routing
- .env.sample: RabbitMQ, IntaSend, UjumbeSMS, Gmail OAuth2, OpenAuth variables
- .justfile: dev, docker, database, utility, and production commands
- Implements: REWRITE_SPEC.md Parts 16, 17

## [61efcf7] feat: Task 11 — infra/gateway KrakenD config with 37 endpoints, JWT validation, CORS

- Added krakend.json: global config (port 8009, 30s timeout, CORS for *.otienoobogeandcompany.com)
- Added 15 hotel endpoints, 13 bar endpoints, 11 restaurant endpoints (all protected)
- Added 2 public endpoints: /api/public/roomtypes and /api/public/menu (no auth/validator)
- JWT validator: ES256, OpenAuth JWKS, propagate_claims with dot notation (properties.email, properties.userType)
- CRITICAL: every protected endpoint has input_headers ["x-user-id","x-user-email","x-user-type"]
- Added KrakenD Dockerfile (devopsfaith/krakend:2)
- Implements: REWRITE_SPEC.md Part 12

## [3ce8644] feat: Tasks 7-10 — restaurant, checkout, SMS, and SMTP services

- Task 7: Restaurant service — 11 endpoints (menu CRUD + order lifecycle pending→preparing→ready→served→cancelled), port 8005
- Task 8: Checkout service — Hono/Bun, subscribes to "mpesa" queue, calls IntaSend STK push, port 8008
- Task 9: SMS service — subscribes to "sms" queue, calls UjumbeSMS API with email+X-Authorization headers, port 7879
- Task 10: SMTP service — subscribes to "mails" queue, Gmail OAuth2 + Nodemailer + Handlebars email.hbs template, port 3300
- Implements: REWRITE_SPEC.md Parts 8, 9, 10, 11

## [0fe024f] feat: Task 6 — services/bar with 11 endpoints, Multer+MinIO upload, bug fix fetchBarSale

- Added 11 Express routes: drinks (3), purchases (3), sales (3), lipa-mpesa (1), API info (1)
- Implemented addBarDrinks with Multer+MinIO upload, per-unit price calc (crates/pack ÷ packageQty)
- Implemented postBarPurchases with stock value calc and $set stockQty update
- Implemented postBarSales multi-item checkout with stock validation and $inc decrement
- Fixed fetchBarSale bug: was referencing undefined `saleID`, now correctly uses `salesId` param
- Added lipaNaMpesa stub that publishes to "mpesa" queue
- Implements: REWRITE_SPEC.md Part 7

## [185576d] feat: Task 5 — services/hotel with 17 Express endpoints and 14-step booking flow

- Added 17 Express routes: customers (4), bookings (3), invoices (2), rooms (5), M-Pesa/SMS (2), API info (1)
- Implemented full 14-step addBookings flow: validation, customer/roomType lookup, room availability, invoice calc (16% VAT), booking create, room marking
- Added getDatesInRange utility, initiateMpesaPayment and initiateSmsNotification RabbitMQ publishers
- Added createRoom with RoomType.rooms $push, createRoomType
- No CORS on service — KrakenD handles gateway-level CORS
- Implements: REWRITE_SPEC.md Part 6

## [ec7cb58] feat: Task 4 — packages/queue with RabbitMQConfig and rabbitMQEnvFromProcess

- Added RabbitMQConfig class with exponential backoff retry (maxRetries, initialDelay, maxDelay, factor)
- Added connect, createQueue, publishToQueue, subscribeToQueue, close methods
- Added reconnect logic on connection close event
- Added rabbitMQEnvFromProcess helper to read env vars
- Implements: REWRITE_SPEC.md Part 5

## [7c704a9] feat: Task 3 — packages/auth middleware + infra/openauth server

- Added infra/openauth/src/subjects.ts with valibot user subject shape
- Added infra/openauth/src/index.ts: PasswordProvider + MongoDB user lookup, Bun entry
- Added infra/openauth/Dockerfile (oven/bun:1.1-alpine, port 3100)
- Added packages/auth/src/subjects.ts (standalone copy, no circular dep on infra/)
- Added packages/auth/src/verify.ts: createClient + verifyAuth for SvelteKit apps
- Added packages/auth/src/middleware.ts: extractUser, requireAuth, requireUserType, requireReceptionist, requireBarista, requireWaiter, requireAdmin
- Implements: REWRITE_SPEC.md Part 4

## [a031ee1] feat: Task 2 — packages/db with all 11 Mongoose schemas and connection helper

- Added 11 Mongoose models: User, Customer, RoomType, Room, Booking, Invoice, Drink, BarPurchase, BarSale, MenuItem, RestaurantOrder
- User schema: expanded userType enum, removed password/resetLink/isAdmin, added openauth_subject_id
- MenuItem and RestaurantOrder are new schemas for restaurant domain
- Added connectDB helper with strictQuery=false and debug support
- Added barrel exports via src/index.ts and src/models/index.ts
- Implements: REWRITE_SPEC.md Part 3

## [d94a27d] feat: Task 1 — monorepo scaffold with root config and placeholder packages

- Added pnpm-workspace.yaml covering apps/*, services/*, packages/*, infra/openauth
- Added turbo.json with build/dev/lint/typecheck/db:migrate tasks per spec
- Added root package.json with turbo scripts and pnpm@9.0.0 packageManager
- Added packages/config with tsconfig.base.json and tsconfig.node.json presets
- Added placeholder package.json files for all 6 packages, 6 services, 3 apps, infra/openauth
- Implements: REWRITE_SPEC.md Part 2
