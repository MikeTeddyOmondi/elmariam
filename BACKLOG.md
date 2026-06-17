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

## In Progress

- [ ] `pnpm install` lockfile update after package.json changes
- [ ] Final commit on `feat/simplifying-stack`

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
