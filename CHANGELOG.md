# Changelog

## [Unreleased] — refactors/track-b

### Added

#### Monorepo Infrastructure
- `pnpm-workspace.yaml` — defines workspace packages: `api/*`, `ui/*`, `sms`, `smtp`, `packages/*`; checkout excluded (Bun)
- `package.json` (root) — private workspace root with `turbo`, `typescript` devDeps
- `turbo.json` — Turborepo pipeline: `build` (dependsOn `^build`), `lint`, `test`, `dev`
- `tsconfig.base.json` — shared TypeScript config extended by all services
- `pnpm-workspace.yaml`

#### Shared Packages
- `packages/types/` — `@elmariam/types`: shared domain interfaces (`User`, `TokenPayload`, `BookingRequest`, `ApiResponse`, `SmsPayload`, `EmailPayload`, etc.)
- `packages/utils/` — `@elmariam/utils`: `logger` (pino + requestId middleware), `errorHandler` (standardized error envelope), `validateBody`/`validateParams` (zod middleware), `createError`

#### GitHub Actions CI/CD
- `.github/workflows/ci.yml` — change detection via `dorny/paths-filter`; dynamic matrix builds only changed services; no image push on PRs
- `.github/workflows/_service-build.yml` — reusable workflow: lint → test → prune → docker build/push; scoped GHA layer cache per service
- `.github/workflows/release.yml` — triggered by `v*` tags or `workflow_dispatch`; accepts comma-separated service list + explicit tag override; builds all by default

#### TypeScript Stubs
- `tsconfig.json` added to: `api/auth`, `api/hotel`, `api/bar`, `api/restaurant`, `sms`, `smtp`

#### Track Documentation
- `TRACK_A.md` — Lightweight track: pnpm only, pnpm deploy, per-service workflows, incremental TS
- `TRACK_B.md` — Balanced track (implemented): pnpm + Turborepo, turbo prune Docker, single workflow + matrix CI
- `TRACK_C.md` — Full power track: pnpm + Nx, affected graph CI, Nx Cloud caching

### Changed

#### Dockerfiles (all services rewritten)
- Base images updated: `node:18.18.2-alpine` → `node:22-bookworm-slim` (build stages) + `gcr.io/distroless/nodejs22-debian12` (runtime) for all Node services
- Pattern: turbo prune `out/` context → 3-stage build (deps / builder / runner)
- UI panels: `node:22-bookworm-slim` build + `nginx:bookworm-slim` runtime with `apt-get upgrade`
- `HEALTHCHECK` added to every service Dockerfile
- Non-root user (`nonroot` on distroless, `appuser` on node images)
- Removed double `npm install` anti-pattern (was running install twice per build)

#### `.justfile`
- All `npm install` / `docker build <service-dir>` recipes replaced with `turbo prune + docker build out/` pattern
- Added `_prune-and-build`, `_prune-and-build-root`, `_prune-and-build-ui` helpers
- Added `lint`, `test`, `build-service <name>` recipes
- Added `push` and `push-all` recipes

#### `ui/user/package.json`
- `name` corrected from `"admin-panel"` (duplicate) → `"user-panel"`

#### `.dockerignore` files
- Root `.dockerignore` created (covers `.git`, `node_modules`, `dist`, `.env`, lock files, docs)
- `ui/admin/.dockerignore`, `ui/user/.dockerignore`, `ui/web/.dockerignore` — were empty, now populated

### api/auth — TypeScript migration

#### Bugs fixed
- **Token expiry**: `expired_at.setDate(expired_at.getDate())` (no-op) → `expired_at.setDate(expired_at.getDate() + 7)` to match the 7-day JWT expiry
- **JWT verify anti-pattern**: callback with `throw err` replaced with synchronous `jwt.verify()` inside try/catch
- **Wrong HTTP status codes**: `500` returned for client errors (duplicate email, invalid credentials) → `409 Conflict` for duplicates, `401` for auth failures
- **User enumeration**: Login no longer returns different messages for "user not found" vs "wrong password"

#### Security improvements
- `helmet()` middleware added
- `express-rate-limit` (20 req / 15 min) applied to all `/api/v1` routes
- `mongoose.set('strictQuery', false)` → `true`
- CORS origins moved from hardcoded array → `CORS_ORIGINS` environment variable (comma-separated)
- Request body validated with `zod` schemas before reaching controller (register: email format, password strength, min lengths; login: email format)

#### Observability
- All `console.log` calls replaced with `pino` logger via `@elmariam/utils`
- `requestLogger()` middleware threads `requestId` through all log lines and sets `X-Request-Id` response header
- `/health` endpoint added returning `{ status, service, timestamp }`

#### Code quality
- Parallel `Promise.all` for duplicate-check queries in Register (3 sequential DB calls → 1 round trip)
- Sensitive fields (`id_number`, `password`, `resetLink`) excluded from Accounts query projection
- `src/utils/error.js` removed — replaced by `@elmariam/utils` `createError`

#### New files
- `src/config/config.ts` — typed config with `required()` guard (fails fast on missing env vars)
- `src/models/User.ts` — Mongoose model with `IUser` interface
- `src/models/Token.ts` — Mongoose model with `IToken` interface
- `src/schemas/auth.schemas.ts` — zod schemas + inferred types for Register and Login bodies
- `src/utils/verifyAdmin.ts` — JWT middleware, fixed callback anti-pattern, 403 for wrong role
- `src/controllers/auth.ts` — all controller functions fully typed
- `src/routes/routes.ts` — routes wired with zod validation middleware
- `src/index.ts` — Express app bootstrap with all production middleware

#### Removed files
- `src/index.js`, `src/config/config.js`, `src/controllers/auth.js`
- `src/models/Token.js`, `src/models/User.js`, `src/routes/routes.js`
- `src/utils/error.js`, `src/utils/verifyAdmin.js`
