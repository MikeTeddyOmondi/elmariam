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

- [ ] `packages/ui` → real shadcn-svelte (components.json, bits-ui) with the existing primitives replaced one at a time
- [ ] Add `form`, `select`, `textarea`, `checkbox`, `switch`, `sonner`, `alert-dialog`, `dropdown-menu`, `skeleton`
- [ ] Convert the 14 form-driven `command()`s to `form()` remote functions
- [ ] Rewrite the 16 hand-rolled `onsubmit` forms to `<form {...myForm}>` with `fields.x.as(...)` and inline `.issues()`
- [ ] Normalize sonner: export `Toaster`/`toast` from `@elmariam/ui`, add a shared `toastError` mapping 401/403
- [ ] Fix `staff/barista/drinks/new` — still POSTs to the removed gateway (the `createDrink` remote now exists)
- [ ] Delete the dead stub `apps/admin/src/routes/bar-drinks/+page.server.ts`

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
