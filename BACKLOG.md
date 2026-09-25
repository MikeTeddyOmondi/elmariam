# Backlog: feat/simplifying-stack

## Completed

- [x] `packages/db/src/errors/`: domain error classes (hotel, bar, restaurant, users)
- [x] `packages/db/src/operations/`: typed DB operation functions
- [x] `services/integrations`: consolidated M-Pesa + SMS + SMTP service
- [x] `hooks.server.ts`: DB connection singleton in all 3 apps
- [x] Rewrite all 10 remote function files (staff, admin, website)
- [x] Single `MONGODB_URL` across apps and services via docker-compose anchor
- [x] GitHub Actions CI workflow (typecheck + build)
- [x] GitHub Actions Release workflow (Docker matrix + GitHub Release)
- [x] Documentation: README, CONTRIBUTING, PLAN, CHANGELOG, ERROR_HANDLING

## Completed: RBAC & auth hardening

- [x] `packages/auth/src/rbac.ts`: roles, permissions, app access, staff sections (single source of truth)
- [x] `admin` = all permissions + all three apps; `management` = read-only
- [x] Per-app `src/lib/server/guard.ts` (`requireUser`, `requirePermission`, `requireAppAccess`)
- [x] `requirePermission` on every query and mutation in all 10 `.remote.ts` files
- [x] `/receptionist`, `/barista`, `/waiter` section guards in the staff app
- [x] Ownership scoping for website bookings/invoices; `createBooking` takes the customer from the session
- [x] Delete dead `lib/server/auth.ts` helpers (incl. the unverified `atob()` JWT decode)
- [x] Collapse five copies of `subjects` into `@elmariam/auth`; `userType` as a picklist
- [x] Staff landing page redirects server-side instead of via a `user_type` cookie
- [x] `infra/openauth`: `isActive` check, schema-valid user documents, explicit TTLs, single Mongo client, `/health`, `sendCode` → `mails` queue
- [x] `scripts/seed-roles.mjs` + `pnpm roles` for role administration
- [x] `pnpm turbo typecheck` clean across all 13 workspace tasks

## In Progress: forms & UI

### Done

- [x] Tailwind v3 → v4 across all apps + `packages/ui`; one shared `app.css`
- [x] `packages/ui`: `components.json` + `bits-ui` + `tailwind-variants` wired up
- [x] `Button` moved to `tailwind-variants` (exports `buttonVariants`, adds `href`)
- [x] `Input` gains `aria-invalid` styling for inline form errors
- [x] New components: `Form.Field` / `Form.FieldErrors` / `Form.Message`, `Select`, `Textarea`, `Checkbox`, `Switch`, `AlertDialog`, `Skeleton`, `Toaster`
- [x] `toastError()` / `messageFor()` in `@elmariam/ui`: maps 401/403/404 and reads SvelteKit's `error()` body, which `err.message` never exposed
- [x] `ASSIGNABLE_STAFF_ROLES` typed as a const tuple so `v.picklist` cannot accept `customer`

### Eager remote queries during SSR

29 pages call remote queries at component top level (`const rows = getRows()`),
which fires a fetch during SSR: Svelte warns *"Avoid calling `fetch` eagerly
during server-side rendering"* and the result is not hydratable, producing
`hydratable_missing_but_required`. Convert each to the pattern the admin app
already uses: `$state` + `$effect`, with `{#if loading}` / `{:else if loadError}`
markup instead of `{#await}`.

- [x] website: 6 call sites across `portal/{,bookings,bookings/new,invoices,profile}`
- [x] staff `receptionist/`: 9 call sites (`+page`, `customers`, `bookings`, `bookings/new`, `invoices`, `rooms`)
- [x] staff `waiter/`: 5 call sites (`+page`, `menu`, `orders`, `orders/new`)
- [x] staff `barista/`: 9 call sites (`+page`, `drinks`, `purchases`, `purchases/new`, `sales`, `sales/new`)

No `{#await}` on a remote query remains in either app; `grep -rn "{#await"` over
`apps/*/src/routes` returns nothing.

### Conversion checklist: each form to `form()` + shadcn components

Pattern per form: `command()` → `form(schema, handler)`; page drops `onsubmit` for
`<form {...myForm}>`; raw `<input>`/`<select>` → `Input` / `Select` / `Textarea` /
`Checkbox` inside `Form.Field`; inline `Form.FieldErrors` from `fields.x.issues()`;
`confirm()` → `AlertDialog`; toasts via `toastError` from `@elmariam/ui`.

**Remote queries must be called inside `$effect` and held in `$state`**: calling
them from `{#await}` in markup causes `hydratable_missing_but_required`.

- [x] admin `/users`: `createUser` + `deleteUser` converted; **reference implementation**, copy this pattern
- [x] website `portal/bookings/new`: `createBooking` converted
- [x] website `portal/{,bookings,invoices,profile}`: rebuilt on `Card`/`Table`/`Badge`/`Skeleton` + lucide icons; hardcoded `#fff`/`#1a1a2e` replaced with theme tokens so dark mode works
- [ ] admin `/users`: `updateUser` still has no UI (edit-row form)
- [x] admin `/customers`: `createCustomer`
- [x] admin `/bookings`: `createBooking`
- [x] admin `/rooms`: `createRoom`
- [x] admin `/room-types`: `createRoomType`
- [x] admin `/bar-drinks`: `createDrink`; dead `+page.server.ts` stub deleted
- [x] admin `/bar-purchases`: `createBarPurchase`; product is now a drink picker rather than a free-text ObjectId box
- [x] admin `/menu-items`: `createMenuItem`
- [x] admin `/menu-items`: `updateMenuItem` (converted from `command()` to `form()`, edit row) still has no UI
- [ ] admin `/bar-sales`: wire the unused `checkoutBarSale`
- [x] staff `receptionist/customers/new`: `createCustomer`
- [x] staff `receptionist/bookings/new`: `createBooking`
- [x] staff `barista/purchases/new`: `createBarPurchase`; product is a drink picker
- [x] staff `barista/sales/new`: `checkoutBarSale`, dynamic cart via indexed `fields.checkoutDrinkItems[i]`
- [x] staff `barista/drinks/new`: **deleted**. It POSTed to the removed gateway and drinks are admin-only; `barista` lost `drinks:write`
- [x] staff `waiter/orders/new`: `createOrder`, dynamic line items via indexed `fields.items[i]`
- [x] website `contact`: publishes to the `mails` queue and shows a thank-you confirmation

## Done: production readiness pass

- [x] `just build-all` completes from a clean slate (all five images removed first)
- [x] `services/integrations` Dockerfile copies `packages/auth/package.json`, which the root workspace link requires
- [x] All five Dockerfiles install `pnpm@9.0.0` rather than whatever `npm install -g pnpm` resolves to
- [x] Every external dependency pinned from the lockfile; `.npmrc` sets `save-exact=true`
- [x] `mongo` and `rabbitmq` healthchecks, with the apps gated on `service_healthy`
- [x] `scripts/smoke-test.sh` rewritten (12 checks, all passing against the live stack); `test-api.sh` deleted
- [x] Git hooks installed via `.githooks` plus a `prepare` script, including a new rule rejecting unpinned dependency versions
- [x] Em and en dashes stripped from everything authored during this work
- [x] All buttons show a pointer cursor, via `packages/ui` `Button`
- [x] Browser verification against the running stack: edit rows on `/users` and `/menu-items` persist to MongoDB, a drink and purchase and sale round-trip with stock moving 0 to 10 to 5, a refused delete toasts its reason, a permitted delete removes the row, and `management` sees no write controls while `deleteDrink` returns 403
- [ ] `buyingPrice` and `sellingPrice` on `Drink` have no writer and are always 0. Either populate them or drop them from the schema
- [x] Apply the `can()` permission gating to the staff app the way the admin app now does, plus a server guard on each create route

## Planned: update & delete flows

Creates and reads are done everywhere. Editing and removing records is the
remaining gap. `management` must see these hidden/disabled (it holds no
`*:write` or `*:delete`), and destructive actions use `AlertDialog` like
admin `/users` already does.

### `packages/db`: operations that do not exist yet

- [x] `operations/hotel.ts`: `deleteCustomer` (refuses when the customer has bookings)
- [ ] `operations/hotel.ts`: `updateCustomer`
- [ ] `operations/hotel.ts`: `updateBooking`, `cancelBooking`, `checkOutBooking`
- [x] `operations/hotel.ts`: `deleteRoom`, `deleteRoomType` (each refuses when dependants exist)
- [ ] `operations/hotel.ts`: `updateRoom`, `updateRoomType`
- [x] `operations/bar.ts`: `deleteDrink` (refuses when the drink has purchases)
- [ ] `operations/bar.ts`: `updateDrink`, `updatePurchase`
- [x] `operations/restaurant.ts`: `deleteMenuItem`
- Follow the existing `Result`-returning style used by `createBooking`

### Remotes that exist but have no UI

- [x] admin `/users`: `updateUser` (edit row using `.for(user.id)`)
- [ ] admin `/menu-items`: `updateMenuItem`
- [x] admin `/bar-sales`: `checkoutBarSale`
- [x] admin `/invoices` route wiring `getInvoices`, with a billed total and a sidebar entry
- [ ] `markOrderPaid` and `searchCustomer` in `packages/db` have no caller

### New update/delete UI once the db ops land

- [x] admin delete on customers, rooms, room-types, bar-drinks, menu-items (`AlertDialog` confirmed)
- [ ] admin edit on customers, bookings, rooms, room-types, bar-drinks, bar-purchases
- [ ] admin delete on bookings and bar-purchases (needs cancel/reverse semantics, not a hard delete)
- [ ] staff read-only pages get the row actions their role permits
- [ ] website `portal/profile`: edit action (`createCustomer` exists for first-time setup; no update path)
- [ ] login/register pages (×4): replace ad-hoc `let error` state with `toastError`
- [x] All three layouts render the shared `<Toaster />` from `@elmariam/ui`
- [ ] Swap the remaining page-level `import { toast } from 'svelte-sonner'` to `@elmariam/ui`
- [ ] Audit every converted form for the `const ok = await submit()` guard: toasting without it reports success on invalid submissions

### Website public pages still on hardcoded colours (broken in dark mode)

- [x] `portal/bookings/new`, `portal/bookings/[id]`
- [x] `rooms/+page.svelte`: also fixed: was fetching the removed gateway and silently rendering empty
- [x] `restaurant/+page.svelte`: same gateway fix
- [x] `about/+page.svelte`

No `GATEWAY_URL` / `:8009` reference remains anywhere in `apps/` or `packages/`.

### Deferred

- [ ] `dropdown-menu`: add when a page actually needs it
- [x] Real bits-ui `Select` across all 19 call sites, replacing the styled native element. Forms containing one no longer submit without JavaScript: accepted deliberately

## Planned: next pass

### Unify create and edit into modal forms

- [ ] Every create and edit form becomes a modal opened by an explicit action button, so each client is a listing plus dialogs instead of a listing plus a page per form. Collapses the five staff `*/new` routes and the create cards now sitting above every admin table
- [ ] Not dismissable: no Escape, no outside click, no close button while a submission is pending. bits-ui `Dialog` takes `escapeKeydownBehavior="ignore"` and `interactOutsideBehavior="ignore"`; `packages/ui` already ships a `dialog` component to build on
- [ ] Closes only after a successful post. The `const ok = await submit()` guard already in place is the hook: close on `true`, keep the dialog open and show the issues on `false`
- [ ] One standard width for every modal, set in the shared component rather than per page
- [ ] Submit stays disabled until every required field is filled. Remote forms expose `fields.value()` and `validate()`, and a preflight schema populates `issues()` client-side without a round trip, so the gate can be derived rather than hand-rolled
- [ ] Deleting the `*/new` routes removes the `+page.server.ts` permission guards added for them. The remote functions guard themselves, so the protection holds, but the trigger buttons must then be gated with `can()` the way the admin row actions are

### Recompute `inStock` when stock moves

- [ ] `inStock` is wrong today and the clients show it. `createPurchase` sets `inStock: true` unconditionally and nothing ever sets it back: `createSale` decrements `stockQty` but leaves the flag alone. Observed live: `{ stockQty: 0, inStock: true }`, so the table reads "Yes" for a drink with nothing left
- [ ] Derive it from the quantity after every stock movement, in both `createPurchase` and `createSale`, rather than trusting a separately maintained boolean
- [ ] If this goes in as mongoose middleware, note that document hooks do not fire for `updateOne`/`bulkWrite`, which is what `packages/db/src/operations/bar.ts` uses. Either declare the hook for those operations or set the flag in the same update expression
- [ ] Consider dropping the field and computing `stockQty > 0` at read time, which cannot drift

### Migrate media uploads from MinIO to RustFS

- [ ] Replace the `minio` compose service with RustFS and repoint the bucket, credentials and env vars
- [ ] RustFS is S3 compatible, so the client library may carry over unchanged. Confirm before assuming it
- [ ] Nothing uploads today: the drink image upload went away with the gateway and `Drink.imageUrl` is now optional. So this is a clean slate rather than a migration of live objects, and it supersedes the older "MinIO direct upload from SvelteKit" item below

### Sonner toasts only, no alerts nested in components

- [ ] Replace the nested `<Alert>` blocks with toasts: 17 `.svelte` files across admin and staff still render one, mostly for a failed load
- [ ] The 26 inline `{loadError}` paragraphs are the same pattern in a different shape and should go the same way
- [ ] Open question to settle first: field-level validation errors are inline under their input by shadcn-svelte convention, and `Form.Message` renders form-level issues in the form. Those are deliberate and they conflict with "no alerts nested in components", so decide explicitly whether they are in scope before starting. See the tension with the shadcn alignment item below

### Align every form with shadcn-svelte conventions

- [ ] Audit all forms against the upstream shadcn-svelte form patterns: consistent `Form.Field` / `Label` / `Input` / `Form.FieldErrors` structure, description text, required indicators, `aria-invalid` wiring, and grid behaviour down to phone width
- [ ] Standardise widths and submit button states so the modals above inherit one shape rather than nine

## Planned: admin/staff feature gaps

- [ ] `packages/db`: missing `update*`/`delete*` for customers, bookings, rooms, room types, drinks, purchases
- [ ] Wire remotes that exist but have no UI: `updateUser`, `updateMenuItem`, `checkoutBarSale`, `getInvoices`
- [ ] Admin update/delete forms with `alert-dialog` confirms, gated on `:write` / `:delete`
- [ ] Row actions on the read-only staff pages
- [ ] Website: `portal/profile` edit, wire `contact` to the SMTP queue
- [ ] Expose `markOrderPaid` and `searchCustomer` (currently no caller)

## Planned

- [ ] ~~MinIO direct upload from SvelteKit for bar drink images~~ superseded by the RustFS migration above
- [ ] `packages/db/src/operations/analytics.ts`: aggregate queries for dashboard stats
- [ ] Website booking flow end-to-end smoke test. `test-api.sh` is gone; extend `scripts/smoke-test.sh`
- [x] Docker Compose health checks for mongo and rabbitmq containers
- [ ] Add `RABBITMQ_URL` support to `@elmariam/queue` alongside individual env vars

## Ideas / Future

- [ ] OpenAPI spec generated from Mongoose schemas
- [ ] Pagination support in `listBookings`, `listCustomers`, `listOrders`
- [ ] WebSocket push for restaurant order status updates (replace polling)
- [ ] Background job scheduling for non-critical work (replace fire-and-forget queue pattern)
- [ ] Migrate `infra/openauth` to use `MONGODB_URL` (currently uses separate `DB_URL`)
