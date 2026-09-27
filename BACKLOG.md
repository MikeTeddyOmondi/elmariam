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
- [x] admin `/users`: `updateUser` edit modal
- [x] admin `/customers`: `createCustomer`
- [x] admin `/bookings`: `createBooking`
- [x] admin `/rooms`: `createRoom`
- [x] admin `/room-types`: `createRoomType`
- [x] admin `/bar-drinks`: `createDrink`; dead `+page.server.ts` stub deleted
- [x] admin `/bar-purchases`: `createBarPurchase`; product is now a drink picker rather than a free-text ObjectId box
- [x] admin `/menu-items`: `createMenuItem`
- [x] admin `/menu-items`: `updateMenuItem` edit modal
- [x] admin `/bar-sales`: `checkoutBarSale` wired (Record Sale modal)
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
- [x] `operations/hotel.ts`: `updateCustomer` (`id_number` left immutable)
- [ ] `operations/hotel.ts`: `updateBooking`, `cancelBooking`, `checkOutBooking` (deferred: these touch invoices, room availability and reservation dates, so they are more than a field update)
- [x] `operations/hotel.ts`: `deleteRoom`, `deleteRoomType` (each refuses when dependants exist)
- [x] `operations/hotel.ts`: `updateRoom`, `updateRoomType`
- [x] `operations/bar.ts`: `deleteDrink` (refuses when the drink has purchases)
- [x] `operations/bar.ts`: `updateDrink` (stock fields left to purchases/sales)
- [ ] `operations/bar.ts`: `updatePurchase` (deferred: editing a purchase must reverse and re-apply its stock movement)
- [x] `operations/restaurant.ts`: `deleteMenuItem`
- All follow the existing `Result`-returning style used by `createBooking`

### Remotes that exist but have no UI

- [x] admin `/users`: `updateUser` (edit modal using `.for(user.id)`)
- [x] admin `/menu-items`: `updateMenuItem` (edit modal)
- [x] admin `/bar-sales`: `checkoutBarSale`
- [x] admin `/invoices` route wiring `getInvoices`, with a billed total and a sidebar entry
- [x] `markOrderPaid` wired: a "Mark paid…" method picker (cash/M-Pesa/Card) in the admin restaurant-orders Payment column, gated on `orders:pay`
- [ ] `searchCustomer` in `packages/db` still has no caller

### New update/delete UI once the db ops land

- [x] admin delete on customers, rooms, room-types, bar-drinks, menu-items (`AlertDialog` confirmed)
- [x] admin edit modals on customers, rooms, room-types, bar-drinks (plus users and menu-items done earlier), each `.for(id)`, gated on `:write`
- [ ] admin edit on bookings and bar-purchases (blocked on the deferred `updateBooking`/`updatePurchase` db ops above)
- [ ] admin delete on bookings and bar-purchases (needs cancel/reverse semantics, not a hard delete)
- [ ] staff read-only pages get the row actions their role permits
- [ ] website `portal/profile`: edit action (`createCustomer` exists for first-time setup; no update path)
- [x] All three layouts render the shared `<Toaster />` from `@elmariam/ui`
- [x] Swapped: no page imports `toast` from `svelte-sonner` directly anymore; all use `@elmariam/ui`
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

## Taxes: 14% VAT + 2% levy

- [x] Every booking, bar sale and restaurant/menu sale now applies **14% VAT** and a **2% hotel levy** on the pre-tax subtotal. Rates live in one place (`packages/db/src/tax.ts`: `VAT_RATE`, `LEVY_RATE`, `computeTax`). Booking VAT was 16%; now 14% and a levy line added
- [x] Stored on each record so figures are authoritative: `Invoice` gained `levy`; `BarSale` and `RestaurantOrder` gained `subTotal`/`vat`/`levy` (their totals are now tax-inclusive)
- [x] Shown on the receipts: Subtotal, VAT (14%), Levy (2%), Total on booking, bar sale and order receipts (admin + staff)
- [ ] Older records created before this change have `levy: 0` (and bar/order `subTotal` defaulting to 0); their receipts will show 0 for those lines. Backfill if historical accuracy matters

## M-Pesa + SMS on bar & restaurant sales

Bar sales and restaurant orders don't store a customer, so the trigger captures
a phone number at action time (amount comes from the sale total).

- [x] Shared, modular helpers in `@elmariam/queue` (`toMsisdn`, `toLocalPhone`, `publishMpesaStk`, `publishSms`) so both apps reuse one implementation instead of copying queue/phone logic
- [x] Thin `payments.remote.ts` in admin + staff exposing `chargeMpesa({ amount, phone, reference, name? })` and `sendSms({ phone, message })`, each gated on `payments:initiate` / `notifications:send`
- [x] Granted `payments:initiate` + `notifications:send` to `barista` and `waiter` so counter staff can charge/notify (currently only admin + receptionist have them)
- [x] Reusable `SalePayActions` UI component (M-Pesa + SMS buttons + a phone-capture dialog) wired into all four listings: bar sales (admin + staff) and restaurant orders/sales (admin + staff)
- [ ] Follow-up: refactor the existing booking `initiateMpesaPayment`/`sendSmsNotification` to use the same shared helpers

## Integrations: M-Pesa + SMS

- [x] IntaSend M-Pesa returned 401. The SDK constructor is `(publishableKey, secretKey, testMode)` but the service passed the secret token first, so auth failed (now swapped). Fixed the order in `services/integrations/src/consumers/mpesa.ts`
- [x] `INTASEND_TEST_MODE` was coerced with `Boolean(process.env…)`, which is `true` for the string "false". Now `=== "true"`
- [x] "SMS sent to 0": the booking producers read the `occupant`/`invoice` virtuals, but `getBooking` was switched to populate the real `customer` path, so `customer` was empty (no phone/amount). Fixed to read `booking.customer`; added phone normalisation (`toMsisdn`/`toLocalPhone` handle `0…`/`7…`/`254…`) and a guard that rejects with a clear message when a customer has no phone
- [x] M-Pesa + SMS action buttons added to the **admin** booking listing (they already existed on staff receptionist bookings), gated on `bookings:write`
- [x] Verified live: integrations logs show `STK push sent` (no 401) and `SMS sent to 0719818293`
- [ ] Confirm the IntaSend keys are **test** keys while `INTASEND_TEST_MODE=true` (live keys need it `false`), and that the same keys live in the root `.env` (compose reads `${INTASEND_API_TOKEN}` from there, not `services/integrations/.env`)

## Bugs found in review

- [x] Restaurant menu items: the "Available on the menu" checkbox could not be toggled on create or edit. The value did flip, but `packages/ui` `Checkbox` styled the tick with an `appearance-none` + `checked:bg-[url(<data-uri>)]` variant that Tailwind v4 never compiled, so a checked box rendered blank and looked stuck. Fixed by rendering a native checkbox with `accent-primary` (browser draws the tick). Also affects `/users` `isActive`
- [x] Admin Bar Sales table: the Sale ID column was blank. `listSales` returned docs with `_id` only (no `id`), while `BarSaleView`/the table read `sale.id`. Fixed by lean-mapping `id` in `listSales`, matching `listDrinks`
- [x] Creating a bar sale threw "This query was not created in a reactive context and cannot be awaited." The submit handler re-read the list with `await getBarSales()`, but a bare remote query is only awaitable in a reactive context (the `$effect` loader); in an event handler it must be run imperatively. Fixed with `getBarSales().run()` in both admin and staff sale modals (the server handler already does a single-flight `refresh()`). Verified live: a sale now records, the table refreshes, and the modal closes

## Planned: next pass

### Unify create and edit into modal forms

- [x] `packages/ui` `Dialog` rebuilt on bits-ui (portalled, animated, theme tokens) to match `AlertDialog`, with a `pending` prop that locks the modal
- [x] Every create form becomes a modal opened by a header action button. Admin: customers, rooms, room-types, bookings, bar-drinks, bar-purchases, bar-sales, menu-items, users. Staff: the four `*/new` routes (receptionist customers + bookings, waiter orders, barista sales) collapsed into their listing pages and the route directories deleted
- [x] Edit becomes a modal too where an update remote exists: admin `/users` (`updateUser`) and `/menu-items` (`updateMenuItem`), replacing the inline expand-row editor. Other edit modals wait on the missing `update*` db ops (see "Planned: admin/staff feature gaps")
- [x] Not dismissable while a submission is pending: no Escape, no outside click, no close button. `Dialog` sets `escapeKeydownBehavior`/`interactOutsideBehavior` to `ignore` and hides the close button when `pending`
- [x] Closes only after a successful post. The `const ok = await submit()` guard closes on `true`; on `false` the dialog stays open and shows the issues
- [x] One standard width (`max-w-lg`) set in the shared `Dialog`, not per page
- [ ] Submit stays disabled until every required field is filled. Today the submit is only disabled while pending. Remote forms expose `fields.value()` and `validate()`, and a preflight schema populates `issues()` client-side without a round trip, so the gate can be derived rather than hand-rolled
- [x] Deleting the `*/new` routes removed their `+page.server.ts` permission guards. The remote functions guard themselves, so protection holds, and every trigger button is gated with `can()`

### Recompute `inStock` when stock moves

- [x] `inStock` was wrong: `createPurchase` set `inStock: true` unconditionally and nothing set it back, so a drink with `stockQty: 0` still read "Yes"
- [x] Dropped the stored field entirely and made `inStock` a Mongoose virtual (`stockQty > 0`), computed at read time so it cannot drift. Read paths already use `.lean({ virtuals: true })`, so `drink.inStock` consumers are unchanged; the stock updates in `bar.ts` are back to a plain `$inc` on `stockQty`

### Migrate media uploads from MinIO to RustFS

- [x] Replaced the `minio` compose service with `rustfs` (`rustfs/rustfs:1.0.0`), same host ports (9003→9000 S3, 9001 console) and same access/secret credentials, on a fresh `elmariam-rustfs-data` volume. Verified live: healthy, S3 API returns the standard `403 AccessDenied` XML at the root
- [x] Confirmed no client library to carry over: there is no S3/MinIO code anywhere in source (uploads went with the gateway; `Drink.imageUrl` is optional), so this was a pure infra swap
- [x] Clean slate rather than an object migration. Supersedes the older "MinIO direct upload from SvelteKit" item below
- [ ] Runs as `user: "0:0"` so the named volume is writable. If a non-root RustFS is wanted later, add a chown/volume-permission helper (uid 10001) instead
- [ ] Old `elmariam-minio-data` volume is now unreferenced; prune it with `docker volume rm elmariam_elmariam-minio-data` once you are sure nothing needs it

### Sonner toasts only, no alerts nested in components

Decision settled: toasts for load/list failures and submit outcomes; keep the
inline shadcn `Form.FieldErrors` (field-level) and `Form.Message` (form-level)
validation errors, since those are the shadcn convention the alignment item wants.

- [x] Admin + staff: every list/load failure now toasts via `toastError(e)` instead of an inline `{loadError}` block or nested `<Alert>`. The `loadError` state and its `{:else if loadError}` branch are gone across all admin and staff list pages; a failed load shows the empty state plus a toast
- [x] Website public pages converted by hand: `restaurant`, `rooms`, `portal/{bookings,bookings/[id],invoices,profile}` now `toastError(e)` on load failure with the inline `{loadError}` block removed; the other `{:else if}` branches (empty states, detail views) were left intact. Typecheck clean
- [x] Action-feedback `<Alert>` blocks that are not load errors: staff `receptionist/bookings` (M-Pesa/SMS) and `waiter/orders` (order status) now `toast.success`/`toastError` from their handlers; the `actionMsg`/`msg` state and inline Alerts (and the now-unused `Alert` imports) are gone
- [x] login pages (×4): all surface auth errors as toasts now. The layout's `<Toaster />` renders above the login branch, so admin/staff logins were converted from inline `<Alert>` to `toast.error` (URL `?error=` handled in an `$effect` after mount); website login/register already bridged `error` → toast

### UI polish

- [x] Cursor pointer restored on everything button-like. Tailwind v4 dropped the browser default; a base rule in the shared `app.css` now sets `cursor: pointer` for `button`, `[role="button"]`, `[role="option"]`, `[role="menuitem"]`, `summary` and `label[for]`, and `not-allowed` for disabled controls
- [x] Sticky sidebar on admin and staff: the shell is now `h-screen overflow-hidden` so the sidebar stays fixed and only `<main>` scrolls
- [x] Shared `Pagination` component brought over from locci-platform into `packages/ui` (bindable `page`, client- or server-side slicing). Wired into **every listing** across admin (users, customers, bookings, invoices, rooms, room-types, bar-drinks, bar-purchases, bar-sales, menu-items, restaurant-orders) and staff (receptionist customers/bookings/invoices/rooms, waiter menu/orders, barista drinks/purchases/sales) at 20 rows/page (10 on admin customers)
- [x] Receipt fixes: booking receipts now show the guest name and the assigned room number (the `Booking` schema gained a `room` ref set at create time, and `listBookings` populates the real `customer`/`roomType`/`room` paths instead of the `occupant`/`room-type` virtuals that left them as raw ObjectIds). Print now captures the whole receipt: the preview copy is non-printable and a dedicated unclipped print copy is rendered outside the dialog. Receipt line spacing tightened

### Align every form with shadcn-svelte conventions

- [x] Cart/line-item modals standardised: bar sales (admin + staff) and waiter orders now stack each line item as a labelled block (`Item N` header + `Form.Field` per input) instead of an inline row with `sr-only` labels, matching every other modal
- [ ] Audit the remaining forms against upstream shadcn-svelte patterns: consistent `Form.Field` / `Label` / `Input` / `Form.FieldErrors` structure, description text, required indicators, `aria-invalid` wiring, and grid behaviour down to phone width
- [ ] Standardise submit button states (the modals already share one width via the `Dialog` component)

### Rebrand to the hotel's colours (mulberry / white)

From the building photo: mauve-mulberry columns on white, near-black plinths.

- [x] Rebranded the shared `packages/ui/src/app.css` design tokens to a mulberry (hue ~330) palette, light + dark, so all three apps changed together. Light: `--primary: 330 40% 45%` on white with white text; soft-rose `secondary`/`muted`/sidebar-accent; warm border. Dark: `--primary: 330 45% 47%` on warm near-black surfaces (`--background: 330 15% 7%`). `destructive` kept red so delete actions still read as danger
- [x] Contrast: primary darkened until white button text clears WCAG AA in both modes (L45%/47%). Verified live in light and dark on the admin app: mulberry buttons, active nav, and logo accent; red delete icons preserved
- [ ] Optional follow-up: retune the five `--chart-*` colours (currently shifted toward the mulberry family) once a real dashboard uses them

## Planned: new features

> Update/delete work and wiring remotes that have no UI live in one place now,
> under "Planned: update & delete flows" above. This section is net-new features
> only, to avoid the duplicated logs that had crept in.

- [x] Printable receipts. Shared `packages/ui` `Receipt` (80mm, monospace, `data-receipt`) + `ReceiptDialog` (preview + Print button → `window.print()`), plus a global `@media print` rule in `app.css` that isolates the receipt so only it reaches the thermal printer. Wired to: **bar sale** (admin + staff), **booking** (admin + staff), and **menu/restaurant order** (staff waiter). Each shows the receipt after a successful create/checkout and offers a per-row Print action to reprint. `listBookings` now sorts newest-first so the just-created booking is previewable. The standalone restaurant menu-sales flow (below) will reuse the same `ReceiptDialog`
- [ ] Restaurant menu sales. A direct "sell menu items" flow like bar sales (cart of menu items → total → record), separate from the waiter order/kitchen workflow, plus a sales listing. Reuse the `checkoutBarSale` cart-modal shape; needs a `restaurant` sale operation + remote in `packages/db`
- [ ] Website: wire the `contact` form to the SMTP queue

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
