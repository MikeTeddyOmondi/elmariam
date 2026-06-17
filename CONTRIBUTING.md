# Contributing

## Monorepo Layout

```
apps/          SvelteKit frontends (admin, staff, website)
packages/      Shared libraries (db, auth, queue, config, ui)
services/      Backend Node services (integrations)
infra/         Infrastructure configs (openauth, gateway)
docs/          Architecture and guide documents
```

**Rule:** App-level business logic lives in `apps/*/src/lib/remote/`. Shared DB access lives in `packages/db/src/operations/`. Never put Mongoose calls directly in app route files.

---

## Branch Strategy

- `feat/simplifying-stack` — active development branch; direct-DB architecture
- `rewrite` — frozen reference; gateway-based architecture (do not merge back)
- Feature branches: `feat/<name>` off `feat/simplifying-stack`
- Bug fixes: `fix/<name>` off `feat/simplifying-stack`

---

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add room availability check to createBooking
fix: map E11000 duplicate key to CustomerAlreadyExistsError
chore: update pnpm lockfile
docs: add ERROR_HANDLING guide
```

Always set the author explicitly:

```
git commit --author="MikeTeddyOmondi <mike_omondi@outlook.com>" -m "feat: ..."
```

No `Co-Authored-By` lines.

---

## Error Handling

- All DB access must go through `packages/db/src/operations/` functions that return `Result<T, E>`
- Remote functions use `result.match` to unwrap — never raw try/catch
- New domains: add `packages/db/src/errors/<domain>.ts` with `TaggedError` classes first, then operations
- See [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md) for the full pattern

---

## Adding a New DB Operation

1. Define domain errors in `packages/db/src/errors/<domain>.ts` (if not already there)
2. Add the operation function to `packages/db/src/operations/<domain>.ts` using `Result.tryPromise`
3. Export it from `packages/db/src/operations/index.ts`
4. Run `pnpm --filter @elmariam/db build` so TypeScript resolves the new export
5. Import and use in the relevant remote file

---

## Single `MONGODB_URL`

All apps and the integrations service connect to `mongodb://mongo:27017/elmariam`. The env var is `MONGODB_URL` — see `.env.sample`. Never hardcode the connection string.

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Build shared packages first
pnpm --filter @elmariam/db build
pnpm --filter @elmariam/queue build

# Start infrastructure
docker compose up -d mongo rabbitmq

# Run an app in dev mode (needs MONGODB_URL in .env)
pnpm --filter @elmariam/staff dev
```

---

## CI

GitHub Actions runs on every push and PR:
- **typecheck** — `pnpm turbo typecheck`
- **build** — `pnpm turbo build` for the three apps

Both jobs use pnpm v10 and Node 22. The lockfile must be committed (`--frozen-lockfile` is enforced).
