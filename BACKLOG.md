# Backlog — feat/simplifying-stack

## Completed

- [x] `packages/db/src/errors/` — domain error classes (hotel, bar, restaurant, users)
- [x] `packages/db/src/operations/` — typed DB operation functions
- [x] `services/integrations` — consolidated M-Pesa + SMS + SMTP service
- [x] `hooks.server.ts` — DB connection singleton in all 3 apps
- [x] Rewrite all 10 remote function files (staff, admin, website)
- [x] Single `MONGODB_URL` across apps and services via docker-compose anchor
- [x] GitHub Actions CI workflow (typecheck + build)
- [x] GitHub Actions Release workflow (Docker matrix + GitHub Release)
- [x] Documentation: README, CONTRIBUTING, PLAN, CHANGELOG, ERROR_HANDLING

## Completed — RBAC & auth hardening

- [x] `packages/auth/src/rbac.ts` — roles, permissions, app access, staff sections (single source of truth)
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

## In Progress — forms & UI

### Done

- [x] Tailwind v3 → v4 across all apps + `packages/ui`; one shared `app.css`
- [x] `packages/ui`: `components.json` + `bits-ui` + `tailwind-variants` wired up
- [x] `Button` moved to `tailwind-variants` (exports `buttonVariants`, adds `href`)
- [x] `Input` gains `aria-invalid` styling for inline form errors
- [x] New components: `Form.Field` / `Form.FieldErrors` / `Form.Message`, `Select`, `Textarea`, `Checkbox`, `Switch`, `AlertDialog`, `Skeleton`, `Toaster`
- [x] `toastError()` / `messageFor()` in `@elmariam/ui` — maps 401/403/404 and reads SvelteKit's `error()` body, which `err.message` never exposed
- [x] `ASSIGNABLE_STAFF_ROLES` typed as a const tuple so `v.picklist` cannot accept `customer`

### Eager remote queries during SSR

29 pages call remote queries at component top level (`const rows = getRows()`),
which fires a fetch during SSR — Svelte warns *"Avoid calling `fetch` eagerly
during server-side rendering"* and the result is not hydratable, producing
`hydratable_missing_but_required`. Convert each to the pattern the admin app
already uses: `$state` + `$effect`, with `{#if loading}` / `{:else if loadError}`
markup instead of `{#await}`.

- [x] website — 6 call sites across `portal/{,bookings,bookings/new,invoices,profile}`
- [x] staff `receptionist/` — 9 call sites (`+page`, `customers`, `bookings`, `bookings/new`, `invoices`, `rooms`)
- [x] staff `waiter/` — 5 call sites (`+page`, `menu`, `orders`, `orders/new`)
- [x] staff `barista/` — 9 call sites (`+page`, `drinks`, `purchases`, `purchases/new`, `sales`, `sales/new`)

No `{#await}` on a remote query remains in either app; `grep -rn "{#await"` over
`apps/*/src/routes` returns nothing.

### Conversion checklist — each form to `form()` + shadcn components

Pattern per form: `command()` → `form(schema, handler)`; page drops `onsubmit` for
`<form {...myForm}>`; raw `<input>`/`<select>` → `Input` / `Select` / `Textarea` /
`Checkbox` inside `Form.Field`; inline `Form.FieldErrors` from `fields.x.issues()`;
`confirm()` → `AlertDialog`; toasts via `toastError` from `@elmariam/ui`.

**Remote queries must be called inside `$effect` and held in `$state`** — calling
them from `{#await}` in markup causes `hydratable_missing_but_required`.

- [x] admin `/users` — `createUser` + `deleteUser` converted; **reference implementation**, copy this pattern
- [x] website `portal/bookings/new` — `createBooking` converted
- [x] website `portal/{,bookings,invoices,profile}` — rebuilt on `Card`/`Table`/`Badge`/`Skeleton` + lucide icons; hardcoded `#fff`/`#1a1a2e` replaced with theme tokens so dark mode works
- [ ] admin `/users` — `updateUser` still has no UI (edit-row form)
- [ ] admin `/customers` — `createCustomer`
- [ ] admin `/bookings` — `createBooking`
- [ ] admin `/rooms` — `createRoom`
- [ ] admin `/room-types` — `createRoomType`
- [ ] admin `/bar-drinks` — `createDrink`; also delete the dead `+page.server.ts` stub
- [ ] admin `/bar-purchases` — `createBarPurchase`
- [ ] admin `/menu-items` — `createMenuItem`, `updateMenuItem` (no UI yet)
- [ ] admin `/bar-sales` — wire the unused `checkoutBarSale`
- [ ] staff `receptionist/customers/new` — `createCustomer`
- [ ] staff `receptionist/bookings/new` — `createBooking`
- [ ] staff `barista/purchases/new` — `createBarPurchase`
- [ ] staff `barista/sales/new` — `checkoutBarSale`
- [ ] staff `barista/drinks/new` — **broken**, still POSTs to the removed gateway; `createDrink` remote now exists
- [ ] staff `waiter/orders/new` — `createOrder`
- [ ] website `contact` — placeholder, wire to the SMTP queue
- [ ] login/register pages (×4) — replace ad-hoc `let error` state with `toastError`
- [x] All three layouts render the shared `<Toaster />` from `@elmariam/ui`
- [ ] Swap the remaining page-level `import { toast } from 'svelte-sonner'` to `@elmariam/ui`
- [ ] Audit every converted form for the `const ok = await submit()` guard — toasting without it reports success on invalid submissions

### Website public pages still on hardcoded colours (broken in dark mode)

- [x] `portal/bookings/new`, `portal/bookings/[id]`
- [ ] `rooms/+page.svelte` (9 hardcoded values)
- [ ] `restaurant/+page.svelte` (7)
- [ ] `about/+page.svelte` (4)

### Deferred

- [ ] `dropdown-menu` — add when a page actually needs it
- [ ] Rich bits-ui `Select` (combobox) for non-form use; the current `Select` is a styled native element so the no-JS form fallback keeps working

## Planned — admin/staff feature gaps

- [ ] `packages/db`: missing `update*`/`delete*` for customers, bookings, rooms, room types, drinks, purchases
- [ ] Wire remotes that exist but have no UI: `updateUser`, `updateMenuItem`, `checkoutBarSale`, `getInvoices`
- [ ] Admin update/delete forms with `alert-dialog` confirms, gated on `:write` / `:delete`
- [ ] Row actions on the read-only staff pages
- [ ] Website: `portal/profile` edit, wire `contact` to the SMTP queue
- [ ] Expose `markOrderPaid` and `searchCustomer` (currently no caller)

## Planned

- [ ] MinIO direct upload from SvelteKit for bar drink images (bypass Multer middleware)
- [ ] `packages/db/src/operations/analytics.ts` — aggregate queries for dashboard stats
- [ ] Website booking flow end-to-end smoke test (`test-api.sh`)
- [ ] Docker Compose health checks for mongo and rabbitmq containers
- [ ] Add `RABBITMQ_URL` support to `@elmariam/queue` alongside individual env vars

## Ideas / Future

- [ ] OpenAPI spec generated from Mongoose schemas
- [ ] Pagination support in `listBookings`, `listCustomers`, `listOrders`
- [ ] WebSocket push for restaurant order status updates (replace polling)
- [ ] Background job scheduling for non-critical work (replace fire-and-forget queue pattern)
- [ ] Migrate `infra/openauth` to use `MONGODB_URL` (currently uses separate `DB_URL`)
