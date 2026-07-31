# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) for versioned releases. Older entries below are commit-log style from the `rewrite` branch.

---

## [Unreleased]

### Changed — Tailwind v4

- Migrated all three apps and `packages/ui` from Tailwind v3 to v4. Tailwind now runs as a Vite plugin (`@tailwindcss/vite`); `postcss.config.cjs`, `autoprefixer`, `postcss` and all four `tailwind.config.ts` files are deleted
- The theme moved into `packages/ui/src/app.css` using `@theme inline` + `@custom-variant dark`. `inline` is required because the colour tokens reference custom properties that `.dark` redefines — without it dark mode resolves once at build time and stops switching
- The four duplicated `app.css` files collapsed to one: each app's `src/app.css` is now just `@import "@elmariam/ui/app.css"`, so `+layout.svelte` imports are unchanged
- `@source "./lib"` added to the shared stylesheet: `packages/ui` is symlinked into `node_modules`, which Tailwind's automatic content detection skips, so its classes would otherwise be purged
- Explicit `border-color` base rule added — v3 defaulted `border-*` to gray-200, v4 defaults to `currentColor`, which would have made every existing `border` utility inherit the text colour
- `tailwindcss-animate` replaced by `tw-animate-css`; `tailwind-merge` bumped to v4-compatible v3
- Added `bits-ui` and `tailwind-variants` to `packages/ui` for the shadcn-svelte component work

### Changed — forms

- `createUser` / `updateUser` / `deleteUser` (admin) and `createBooking` (website) converted from `command()` to `form()`, so those pages submit without JavaScript and render field-level validation inline
- Domain failures now use `invalid()` instead of throwing `error(400)`, so they appear against the form rather than as an opaque error
- Admin `/users` rebuilt on the shadcn components: `Form.Field` / `Form.FieldErrors`, `Input`, `Select`, `Skeleton`, and an `AlertDialog` replacing `window.confirm()`. Row actions are lucide icon buttons with `aria-label`s
- Website portal pages rebuilt on `Card` / `Table` / `Badge` / `Skeleton`. They previously hardcoded `#fff` and `#1a1a2e`, so they ignored the dark theme entirely
- Remote queries moved into `$effect` + `$state` across the website portal. Calling them at component top level fetches during SSR — Svelte warns *"Avoid calling `fetch` eagerly during server-side rendering"* and the result is not hydratable, which surfaced as `hydratable_missing_but_required` on `/portal/bookings`
- `AlertDialog` gained `confirmForm`, associating its confirm button with a form by id — the dialog content is portalled, so it cannot be a descendant of the form it submits
- The role `<Select>` on `/users` defaults explicitly to `receptionist`; without a default the first option won, silently making `admin` the default for every new user

### Added

- `packages/auth/src/rbac.ts` — single source of truth for roles, permissions, per-app access and staff sections. Replaces six duplicated role arrays across `packages/auth`, `packages/db`, both staff guards and the admin picklists
- Role model: `admin` holds every permission and may log into all three apps; `management` is read-only (every `*:read`, no writes); `receptionist`/`barista`/`waiter` hold granular staff permissions; `customer` is scoped to the website portal
- `src/lib/server/guard.ts` in each app — `requireUser`, `requirePermission`, `requireAppAccess`, plus `requireStaffSection` in staff. Callable from inside remote functions
- `+layout.server.ts` guards for `/receptionist`, `/barista` and `/waiter` in the staff app
- `apps/website/src/lib/server/customer.ts` — `requireOwnCustomer()`, resolving the session's `Customer` record for ownership scoping
- `OwnerScope` filter on `listBookings` / `listInvoices` in `packages/db`
- `scripts/seed-roles.mjs` (`pnpm roles`) — list / set / activate / repair user roles. The issuer only ever auto-provisions `customer`, so this is how the first admin account is created
- `/health` endpoint on `infra/openauth` plus a docker-compose healthcheck
- `OPENAUTH_ALLOW_LOCALHOST` env flag, defaulting to `false`, gating whether `http://localhost:*` is an acceptable redirect target
- Verification-code email template and `mails` queue payload type in `services/integrations`

### Changed

- All 10 `.remote.ts` files now guard every query and mutation with `requirePermission`
- `subjects` collapsed from five copies into `@elmariam/auth`, with `userType` typed as a picklist of `ROLES` instead of a bare string
- App login callbacks and layout guards now use `canAccessApp` instead of hardcoded role lists
- Staff landing page redirects server-side from the verified session instead of reading a client-visible `user_type` cookie
- `packages/auth` is now ESM with subpath exports, so the SvelteKit apps no longer pull `express` into their server bundle
- `@openauthjs/openauth` aligned to `^0.4.3` in `packages/auth` and `infra/openauth` (were on `^0.3.0`, incompatible with the clients)
- `infra/openauth` reuses a single MongoDB client instead of opening a second connection
- `infra/openauth` sets explicit access/refresh TTLs; redirect URIs must now be https on the allowed host unless `OPENAUTH_ALLOW_LOCALHOST=true`
- `infra/openauth/Dockerfile` builds `@elmariam/auth` and `@elmariam/queue`, which the issuer now depends on

### Fixed

- **Every mutation was unauthenticated.** Remote functions are their own HTTP endpoints and are not covered by `+layout.server.ts`, so any authenticated session could call `createUser`/`updateUser`/`deleteUser` and self-promote to admin
- **Website leaked every customer's data.** `getMyBookings` / `getMyInvoices` called `listBookings()` / `listInvoices()` with no owner filter; `getOneBooking` had no ownership check; `createBooking` accepted an arbitrary `customerId` from the client
- **Unverified JWT.** `apps/website/src/lib/server/auth.ts` decoded the token with `atob()` and trusted the payload without checking the signature. That file and its two dead siblings are deleted
- **Broken verifier.** `apps/staff/src/lib/server/auth.ts` called `client.verify(token, token)`, passing the token where `subjects` belongs
- **`admin` was locked out of every app.** The role existed in the `User` enum and admin picklists but no guard accepted it
- A waiter could open the `/barista` and `/receptionist` sections
- `infra/openauth` auto-provisioned users with `{email, userType, createdAt}` only, omitting the schema-required `username`/`id_number` and colliding on the non-sparse unique `id_number` index from the second signup onward
- `infra/openauth` did not check `isActive`, so deactivated accounts could still log in
- `sendCode` only logged verification codes to stdout; it now publishes to the `mails` queue in production
- Portal pages crashed for a customer with no `Customer` profile. The issuer provisions a `User` on first login but the profile is only created when filled in, so "no profile" is a normal state. `getMyBookings`/`getMyInvoices` now return an empty list and `getMyProfile` returns `null`, rather than throwing 404. Writes still reject with 409
- **"Password is incorrect" for valid passwords.** The issuer's storage adapter was pointed at the `elmariam` database while every credential lives in `openauth`. Nothing errors in that state — the issuer finds no `email/<address>/password` entry, rejects every login, and quietly mints a fresh signing key. Storage now defaults to `openauth` and is separate from the users database, both overridable via `OPENAUTH_STORAGE_DB` / `OPENAUTH_USERS_DB`
- Staff app read `OPENAUTH_ISSUER` from bare `process.env` rather than `$env/dynamic/private`
- `docker-compose.yml` did not set `NODE_ENV` for the issuer, which would have left dev-only behaviour active in production

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
