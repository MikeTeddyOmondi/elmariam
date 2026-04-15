# Track A — Lightweight Monorepo

**Profile:** Minimal tooling overhead. Best if you want to move fast without learning new orchestration tools.

---

## Summary

| Axis | Choice |
|---|---|
| Workspace | pnpm workspaces only |
| TypeScript | Incremental (`allowJs: true`) |
| Docker | `pnpm deploy` per service |
| CI/CD | Per-service workflow files with `paths:` filter |
| Effort | ~1–2 weeks |

---

## 1. Workspace Setup

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'api/*'
  - 'ui/*'
  - 'sms'
  - 'smtp'
  # checkout excluded — uses Bun
```

### Root `package.json`
```json
{
  "name": "elmariam",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "install:all": "pnpm install && cd checkout && bun install",
    "build": "pnpm -r run build",
    "lint": "pnpm -r run lint"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

No Turborepo. `pnpm -r` (recursive) runs scripts across all workspace packages.

---

## 2. TypeScript Strategy — Incremental

Add TypeScript progressively without rewriting existing code.

### `tsconfig.base.json` (root)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": false,
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

`allowJs: true` + `checkJs: true` means existing `.js` files get type-checked without needing to rename them. New files are written in `.ts`. Migrate files one at a time when touching them.

### Per-service `tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

---

## 3. Shared Packages

Create a `packages/` directory for code shared across services.

```
packages/
├── types/        # @elmariam/types — shared TypeScript interfaces
│   ├── package.json
│   └── src/
│       └── index.ts
└── utils/        # @elmariam/utils — logger, error helpers, validators
    ├── package.json
    └── src/
        └── index.ts
```

Add `packages/*` to `pnpm-workspace.yaml`. Services reference them as:
```json
{
  "dependencies": {
    "@elmariam/types": "workspace:*",
    "@elmariam/utils": "workspace:*"
  }
}
```

---

## 4. Docker Strategy — `pnpm deploy`

`pnpm deploy` creates a self-contained directory with flat `node_modules` — no symlinks, no workspace context needed inside Docker.

### Build flow (per service)
```bash
# From repo root
pnpm deploy --filter auth --prod .build/auth
docker build -t ranckosolutionsinc/elmariam-auth:1.0.0 \
  -f api/auth/Dockerfile .build/auth
rm -rf .build/auth
```

### Service Dockerfile (simplified — no workspace magic needed)
```dockerfile
FROM node:22-alpine
WORKDIR /app

# pnpm deploy already produced flat node_modules
COPY package.json .
COPY node_modules ./node_modules
COPY dist ./dist

USER 1000
ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "dist/index.js"]
```

### Individual directory build

Each service gets a small `docker-build.sh`:
```bash
#!/usr/bin/env bash
# api/auth/docker-build.sh
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
pnpm deploy --filter auth --prod .build/auth
docker build -t ranckosolutionsinc/elmariam-auth:"${1:-latest}" \
  -f api/auth/Dockerfile .build/auth
rm -rf .build/auth
```

This means `cd api/auth && bash docker-build.sh` still works standalone.

---

## 5. Updated `.justfile`

```just
registry := "ranckosolutionsinc"
version  := "1.0.0"

default:
  just --list

# Install all deps
install:
  pnpm install
  cd checkout && bun install

# Build all TypeScript
build:
  pnpm -r run build

# ── Docker: individual services ───────────────────────────────

_deploy-and-build service tag:
  pnpm deploy --filter {{service}} --prod .build/{{service}}
  docker build \
    -t {{registry}}/elmariam-{{service}}:{{tag}} \
    -f api/{{service}}/Dockerfile \
    .build/{{service}}
  rm -rf .build/{{service}}

build-auth version=version:    just _deploy-and-build auth {{version}}
build-hotel version=version:   just _deploy-and-build hotel {{version}}
build-bar version=version:     just _deploy-and-build bar {{version}}
build-sms version=version:     just _deploy-and-build sms {{version}}
build-smtp version=version:    just _deploy-and-build smtp {{version}}

build-ui-admin version=version:
  docker build -t {{registry}}/elmariam-admin-panel:{{version}} ui/admin/

build-ui-user version=version:
  docker build -t {{registry}}/elmariam-user-panel:{{version}} ui/user/

build-ui-web version=version:
  docker build -t {{registry}}/elmariam-website:{{version}} ui/web/

build-checkout version=version:
  docker build -t {{registry}}/elmariam-checkout:{{version}} checkout/

build-gateway version=version:
  docker build -t {{registry}}/elmariam-api-gateway:{{version}} gateway/

build-all version=version: \
  (build-auth version) \
  (build-hotel version) \
  (build-bar version) \
  (build-sms version) \
  (build-smtp version) \
  (build-ui-admin version) \
  (build-ui-user version) \
  (build-ui-web version) \
  (build-checkout version) \
  (build-gateway version)

# ── Compose ───────────────────────────────────────────────────

compose-up:
  cd proxy     && docker compose -f proxy-service.yml up -d
  cd gateway   && docker compose up -d
  cd api/auth  && docker compose -f auth-service.yml up -d
  cd api/hotel && docker compose -f hotel-service.yml up -d
  cd api/bar   && docker compose -f bar-service.yml up -d
  cd ui/admin  && docker compose -f admin-panel.yml up -d
  cd ui/user   && docker compose -f user-panel.yml up -d
  cd ui/web    && docker compose up -d
  cd checkout  && docker compose -f checkout-service.yml up -d
  cd sms       && docker compose -f sms-service.yml up -d
  cd smtp      && docker compose -f smtp-service.yml up -d

compose-down:
  cd proxy     && docker compose -f proxy-service.yml down
  cd gateway   && docker compose down
  cd api/auth  && docker compose -f auth-service.yml down
  cd api/hotel && docker compose -f hotel-service.yml down
  cd api/bar   && docker compose -f bar-service.yml down
  cd ui/admin  && docker compose -f admin-panel.yml down
  cd ui/user   && docker compose -f user-panel.yml down
  cd ui/web    && docker compose down
  cd checkout  && docker compose -f checkout-service.yml down
  cd sms       && docker compose -f sms-service.yml down
  cd smtp      && docker compose -f smtp-service.yml down
```

---

## 6. GitHub Actions — Per-service Workflow Files

One file per service. Each triggers only when its directory changes.

```yaml
# .github/workflows/auth.yml
name: Auth Service

on:
  push:
    branches: [main]
    paths:
      - 'api/auth/**'
      - 'packages/**'
      - '.github/workflows/auth.yml'
  pull_request:
    paths:
      - 'api/auth/**'
      - 'packages/**'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm deploy --filter auth --prod .build/auth

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        if: github.ref == 'refs/heads/main'
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .build/auth
          file: api/auth/Dockerfile
          push: ${{ github.ref == 'refs/heads/main' }}
          tags: ranckosolutionsinc/elmariam-auth:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Repeat for each service, changing `paths:`, `--filter`, `context:`, `file:`, and `tags:`.

---

## 7. Production Improvements Included

- [ ] Replace real secrets in `.env.sample` with placeholders
- [ ] Add `helmet` to all Express services
- [ ] Fix `mongoose.set("strictQuery", false)` → `true` in auth and hotel
- [ ] Add `express-rate-limit` to auth service
- [ ] Fix SMTP `noAck: true` → `false` with retry logic
- [ ] Add `/health` endpoints to all services
- [ ] Add `HEALTHCHECK` to each Dockerfile
- [ ] Add `zod` input validation on write endpoints
- [ ] Standardize error response shape across services
- [ ] Replace `console.log` with `pino` structured logging
- [ ] Fix token expiry bug in auth service
- [ ] Fix unreachable validation in hotel controller
- [ ] Fix variable name mismatch in bar service

---

## Trade-offs vs Track B

| | Track A | Track B |
|---|---|---|
| Build caching | None | Turborepo remote cache |
| Affected detection in CI | File paths only | Dependency graph aware |
| `docker build` from service dir | Script wrapper needed | Script wrapper needed |
| Tooling to learn | pnpm workspaces | pnpm + Turborepo |
| Monorepo DX | Basic | Significantly better |
