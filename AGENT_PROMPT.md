# El'Mariam Rewrite — Agent Prompt

You are rewriting the El'Mariam hotel, bar, and restaurant management system from scratch on a new `rewrite` branch. Your single source of truth is `REWRITE_SPEC.md` at the repo root. Do not add features, services, schemas, endpoints, packages, or UI pages that are not described in that spec. Do not skip anything the spec describes. If the spec is ambiguous, make the simplest choice that satisfies it and note your assumption in a code comment.

---

## 1. Branch & Old Code Setup

Before writing any new code, perform these one-time setup steps:

```bash
# 1. Create and switch to the rewrite branch
git checkout -b rewrite

# 2. Move ALL existing source code into a reference folder OUTSIDE the repo
mkdir -p ../elmariam-old-reference
# Move everything except .git, .gitignore, and any top-level config you want to keep
git ls-files | xargs -I{} bash -c 'mkdir -p ../elmariam-old-reference/$(dirname "{}") && cp "{}" ../elmariam-old-reference/{}'

# 3. Remove old code from the working tree
git rm -rf .
git checkout HEAD -- .gitignore  # preserve gitignore if it exists

# 4. Place the spec and tracking files at the repo root
# Copy REWRITE_SPEC.md into the repo root (you have it already)
# Create TASKS.md and CHANGELOG.md (templates below)

# 5. Initial commit
git add REWRITE_SPEC.md TASKS.md CHANGELOG.md .gitignore
git commit -m "chore: initialize rewrite branch with spec and tracking files"
```

The old code in `../elmariam-old-reference/` is read-only reference material. Never copy-paste from it wholesale — rewrite everything fresh following the spec. You may read it to verify business logic details.

---

## 2. TASKS.md Format

Maintain `TASKS.md` at the repo root. It is the single checklist of what to build, ordered by the spec's 18 parts. Mark tasks as you complete them. Never reorder, rename, or remove tasks — only change `[ ]` to `[x]`.

Initialize it with exactly this content:

```markdown
# El'Mariam Rewrite — Task Tracker

> Each task maps 1:1 to a part in REWRITE_SPEC.md. Complete them in order.
> Mark `[x]` only after the code is committed and working.

## Phase 1: Foundation

- [ ] **Task 1** — Monorepo scaffold (Part 2)
  - pnpm-workspace.yaml, turbo.json, root package.json, tsconfig presets
  - Empty app/service/package directories with placeholder package.json files

- [ ] **Task 2** — Mongoose schemas & connection (Part 3: packages/db)
  - All 11 models: User, Customer, RoomType, Room, Booking, Invoice, Drink, BarPurchase, BarSale, MenuItem, RestaurantOrder
  - Connection helper, barrel exports, @elmariam/db package.json

- [ ] **Task 3** — Auth package & OpenAuth server (Part 4)
  - infra/openauth: subjects.ts, index.ts (Bun entry), Dockerfile
  - packages/auth: verify.ts, middleware.ts (requireAuth, requireReceptionist, requireBarista, requireWaiter, requireAdmin), barrel exports

- [ ] **Task 4** — Queue package (Part 5: packages/queue)
  - RabbitMQConfig class with retry, rabbitMQEnvFromProcess helper

## Phase 2: Backend Services

- [ ] **Task 5** — Hotel service (Part 6)
  - 17 Express endpoints, booking creation flow (14 steps), getDatesInRange, M-Pesa publish, SMS publish
  - Uses @elmariam/db, @elmariam/auth, @elmariam/queue
  - Dockerfile

- [ ] **Task 6** — Bar service (Part 7)
  - 11 Express endpoints, Multer+MinIO image upload, per-unit price calc, multi-item checkout with stock validation
  - Fix fetchBarSale bug (saleID → salesId)
  - Dockerfile

- [ ] **Task 7** — Restaurant service (Part 8)
  - 11 Express endpoints (NEW), menu CRUD, order lifecycle (pending→preparing→ready→served)
  - Dockerfile

- [ ] **Task 8** — Checkout service (Part 9)
  - Hono/Bun, IntaSend STK push consumer on "mpesa" queue
  - Uses @elmariam/queue
  - Dockerfile

- [ ] **Task 9** — SMS service (Part 10)
  - UjumbeSMS consumer on "sms" queue
  - Uses @elmariam/queue
  - Dockerfile

- [ ] **Task 10** — SMTP service (Part 11)
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
```

---

## 3. CHANGELOG.md Format

Maintain `CHANGELOG.md` at the repo root. Append an entry after every commit. Format:

```markdown
# Changelog

All notable changes to the El'Mariam rewrite are documented here.

## [commit-hash-short] title of commit

- What was added, changed, or fixed (bullet points)
- Reference to the REWRITE_SPEC.md part implemented
```

Example entry:

```markdown
## [a1b2c3d] feat: add packages/db with all Mongoose schemas

- Added 11 Mongoose models: User, Customer, RoomType, Room, Booking, Invoice, Drink, BarPurchase, BarSale, MenuItem, RestaurantOrder
- Added connection helper with retry logic
- Added barrel exports via @elmariam/db
- Implements: REWRITE_SPEC.md Part 3
```

After each commit, update CHANGELOG.md with the actual short hash and amend or create a follow-up commit:

```bash
# After committing your work:
HASH=$(git rev-parse --short HEAD)
# Prepend new entry to CHANGELOG.md (below the header)
# Then:
git add CHANGELOG.md
git commit --amend --no-edit
# OR if you prefer not to amend:
git add CHANGELOG.md
git commit -m "docs: update changelog for $HASH"
```

---

## 4. Commit Discipline

- One commit per task (or per logical sub-unit of a large task).
- Commit message format: `type: description` where type is one of `feat`, `fix`, `chore`, `docs`, `refactor`.
- After each commit: update `TASKS.md` (mark `[x]`), update `CHANGELOG.md` (add entry with hash).
- Never batch multiple tasks into one commit.
- Never commit broken code — each commit should leave the repo in a buildable state (for the parts that exist so far).

---

## 5. Workflow Per Task

For every task, follow this exact sequence:

1. **Read the spec** — Open `REWRITE_SPEC.md` and read the part(s) referenced by the task. Read the full part, not just the heading.
2. **Check old code if needed** — If the spec references existing business logic (e.g. "unchanged from current"), consult `../elmariam-old-reference/` to verify details. Do not copy code — rewrite it.
3. **Write the code** — Create files exactly as the spec describes. Use the directory structure from Part 2. Use the exact package names, model names, field names, route paths, and middleware names from the spec.
4. **Verify** — Run `pnpm install` and `pnpm turbo typecheck` (or equivalent) to confirm no type errors. For services, verify the Express app starts without crashing. For SvelteKit apps, verify `pnpm dev` starts.
5. **Commit** — `git add . && git commit -m "feat: <description>"`
6. **Update tracking** — Mark the task in `TASKS.md`, add entry to `CHANGELOG.md` with the commit hash.
7. **Commit tracking update** — `git add TASKS.md CHANGELOG.md && git commit --amend --no-edit`

---

## 6. Rules — Do Not Violate

1. **REWRITE_SPEC.md is the single source of truth.** If something isn't in the spec, don't build it. If something is in the spec, build it exactly as described.
2. **No Drizzle, no Postgres.** The spec uses Mongoose + MongoDB. Do not introduce any other ORM or database.
3. **No custom auth service.** Auth is handled by OpenAuth (infra/openauth). Services read `x-user-*` headers injected by KrakenD. SvelteKit apps verify tokens via `@openauthjs/openauth/client`.
4. **No load functions, no +page.server.ts, no +server.ts** in SvelteKit apps — except for public SSR pages on the website and the single OpenAuth callback route. Use `.remote.ts` files with `query`/`command` from `$app/server` exclusively.
5. **No CORS on services.** KrakenD handles CORS at the gateway level. Services are never called directly from browsers.
6. **SvelteKit apps talk to KrakenD**, not directly to services. The `apiFetch` helper in remote functions calls `GATEWAY_URL` with the user's token from cookies.
7. **input_headers in KrakenD** — Every endpoint that uses `propagate_claims` MUST also include `"input_headers": ["x-user-id", "x-user-email", "x-user-type"]`. This is a known critical bug pattern.
8. **propagate_claims uses dot notation** — `"properties.email"` not `"properties/email"`. This is a confirmed KrakenD requirement.
9. **Do not rename spec concepts.** If the spec says `requireReceptionist`, the middleware is called `requireReceptionist`. If the spec says `@elmariam/db`, the package is `@elmariam/db`. Naming consistency between spec and code is mandatory.
10. **Track everything.** Every commit updates TASKS.md and CHANGELOG.md. No exceptions.

---

## 7. Task Execution Order

Execute tasks in numerical order (Task 1 → Task 18). Do not skip ahead. Each task depends on the ones before it:

- Tasks 1–4 produce the shared packages that Tasks 5–10 depend on.
- Tasks 5–10 produce the backend services that Task 11 (KrakenD) routes to.
- Task 11–13 produce the infrastructure that Tasks 14–16 (frontend apps) connect to.
- Task 17 produces migration tooling that Task 18 validates.

If a task is blocked by an external dependency (e.g. you can't test IntaSend without API keys), implement the code fully, note the blocker in TASKS.md as a sub-bullet, and move on.

---

## 8. Reference Material

- `REWRITE_SPEC.md` — The spec. Read it. Follow it. Don't deviate.
- `../elmariam-old-reference/` — Old codebase for verifying business logic. Read-only.
- The spec's Part 1 has current vs target architecture diagrams.
- The spec's Part 6 has the full 14-step booking creation flow.
- The spec's Part 7 documents the per-unit price calculation and the fetchBarSale bug fix.
- The spec's Part 12 has the complete KrakenD endpoint table (35+ routes).
- The spec's Part 13 has the remote functions pattern with Valibot validation.

Begin with Task 1.
