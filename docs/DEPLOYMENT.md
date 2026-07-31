# Running El'Mariam in production

Covers a self-hosted deployment on a single machine (a personal PC or a small
VPS) using `docker-compose.yml`.

---

## 1. Host requirements

- Docker with **at least 8 GB** available to the engine.

  On macOS/Colima the default 4 GB is not enough: building the three SvelteKit
  apps concurrently exhausts it and BuildKit dies mid-build with
  `rpc error: code = Unavailable desc = error reading from server: EOF`.

  ```sh
  colima stop && colima start --cpu 4 --memory 8
  ```

  If you cannot raise it, build the apps **one at a time** — a single app build
  fits in 4 GB:

  ```sh
  docker compose build admin
  docker compose build staff
  docker compose build website
  ```

- Ports free on the host: `3000` (admin), `3001` (staff), `3002` (website),
  `3100` (openauth), `27017` (mongo), `5672`/`15672` (rabbitmq),
  `9001`/`9003` (minio), `7979`/`8080` (traefik).

---

## 2. Environment

Copy the sample and fill it in. `.env` is gitignored — it never leaves the host.

```sh
cp .env.sample .env
```

### Required for the stack to boot

| Variable | Notes |
| --- | --- |
| `OPENAUTH_ALLOW_LOCALHOST` | **`true` for a personal PC.** The issuer only accepts `https://*.otienoobogeandcompany.com` redirect URIs otherwise, and login will fail with `unauthorized_client`. Keep it `false` on a public deployment — an attacker-controlled localhost listener would be a valid place to send an authorization code. |
| `RABBITMQ_DEFAULT_USER` / `_PASS` / `_VHOST` | Default to `user` / `password` / `elmariam`. Change the password for anything reachable off-host. |

### Required for features, not for boot

The stack starts without these; the corresponding feature fails at send time.

| Variable | Needed for |
| --- | --- |
| `RESEND_API_KEY`, `EMAIL_SENDER` | All outbound email. **Password reset and registration codes go through this** — `NODE_ENV=production` publishes codes to the `mails` queue instead of logging them, so without a working key nobody can complete a password reset. |
| `UJUMBESMS_API_KEY`, `UJUMBESMS_ACCOUNT_EMAIL`, `UJUMBESMS_API_URL` | Booking SMS notifications. |
| `INTASEND_API_TOKEN`, `INTASEND_PUBLISHABLE_KEY`, `INTASEND_TEST_MODE` | M-Pesa STK push. |

`docker compose config` prints a warning for each unset variable — use it as a
checklist before starting.

---

## 3. Start

```sh
docker compose up -d
```

Wait for the issuer to report healthy — the apps depend on it:

```sh
docker compose ps openauth      # expect "(healthy)"
```

The healthcheck hits `GET /health` on the issuer. If it never goes healthy,
check `docker compose logs openauth`; the usual cause is `DATABASE_URL` pointing
at an unreachable mongo.

---

## 4. Create the first admin

The issuer **only ever auto-provisions the `customer` role**. Staff and admin
accounts are assigned out of band, so a brand-new deployment has no one who can
log into the admin app.

1. Register through the website (`http://localhost:3002/register`) or the
   issuer directly (`http://localhost:3100/password/register`).
2. Promote that account:

   ```sh
   pnpm roles list
   pnpm roles set you@example.com admin
   ```

`pnpm roles` also has `activate <email>` for re-enabling a deactivated account,
and `repair` for backfilling schema-required fields on user documents written by
older versions of the issuer.

### Roles

| Role | Apps | Capability |
| --- | --- | --- |
| `admin` | admin, staff, website | Every permission |
| `management` | admin, staff | **Read-only** — every `*:read`, no writes |
| `receptionist` / `barista` / `waiter` | staff | Their own section only |
| `customer` | website | Own bookings and invoices only |

---

## 5. Reaching the apps

Both routes work; pick one.

- **Direct ports** — `http://localhost:3000` / `:3001` / `:3002`. This is the
  path for a personal PC and needs no DNS.
- **Traefik** — the compose labels route
  `admin-panel.otienoobogeandcompany.com`, `staff.…`, `auth.…`. These only
  resolve if you own the DNS or add hosts entries.

If you serve the apps on real hostnames, three things must change together:

1. `ORIGIN` in each app's Dockerfile (currently `http://localhost:300{0,1,2}`).
   `adapter-node` rejects cross-origin POSTs, and the forms submit natively —
   a wrong `ORIGIN` breaks every form with a 403.
2. `VITE_OPENAUTH_ISSUER` at **build time** — the browser-side auth client bakes
   it into the bundle and falls back to `http://localhost:3100`.
3. `ALLOWED_HOST_SUFFIX` in `infra/openauth/src/index.ts`, which is currently
   pinned to `.otienoobogeandcompany.com`.

---

## 6. Known gaps

- `csrf.trustedOrigins: ['*']` in all three `svelte.config.js` disables
  SvelteKit's CSRF origin check. Tighten this before exposing the stack
  publicly.
- `scripts/smoke-test.sh` is stale — it probes a gateway on `:8009` that was
  removed in the rewrite.
- No automated backup of the `elmariam-mongodb-data` volume. Both the
  application data and the auth store (password hashes, signing keys) live in
  mongo; losing the volume logs everyone out permanently.
