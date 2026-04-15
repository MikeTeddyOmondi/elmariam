# Track B — Balanced Monorepo *(Recommended)*

**Profile:** High value, manageable complexity. Turborepo adds build caching and smart affected detection on top of pnpm workspaces. Best balance of DX and operational control.

---

## Summary

| Axis | Choice |
|---|---|
| Workspace | pnpm + Turborepo |
| TypeScript | One service at a time (auth first) |
| Docker | `turbo prune` + root build context |
| CI/CD | Single workflow + `dorny/paths-filter` dynamic matrix |
| Effort | ~2–4 weeks |

---

## 1. Repository Structure

```
elmariam/
├── .github/
│   └── workflows/
│       ├── ci.yml                # change detection + matrix dispatch
│       ├── _service-build.yml    # reusable: lint, test, docker build/push
│       └── release.yml           # tag-triggered, workflow_dispatch, full rebuild
├── packages/
│   ├── types/                    # @elmariam/types
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts
│   └── utils/                    # @elmariam/utils
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── logger.ts         # pino wrapper with requestId
│           ├── errors.ts         # createError, error response shape
│           └── validate.ts       # zod schema helpers
├── api/
│   ├── auth/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── bar/
│   ├── hotel/
│   └── restaurant/
├── checkout/                     # Bun — NOT in pnpm workspace
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── ui/
│   ├── admin/
│   ├── user/
│   └── web/
├── sms/
├── smtp/
├── gateway/
├── proxy/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                  # root: devDeps only (turbo, typescript)
├── tsconfig.base.json
├── .justfile
├── .env.sample                   # secrets replaced with placeholders
└── .dockerignore                 # root-level, used when building from root
```

---

## 2. Workspace Configuration

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'api/*'
  - 'ui/*'
  - 'sms'
  - 'smtp'
  - 'packages/*'
  # checkout is intentionally excluded — it uses Bun
```

### Root `package.json`
```json
{
  "name": "elmariam",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 3. Turborepo Configuration

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["NODE_ENV"]
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

`"dependsOn": ["^build"]` means if `api/hotel` depends on `packages/types`,
Turborepo builds `packages/types` first automatically. Caching means a second
`turbo run build` on unchanged code completes in milliseconds.

---

## 4. TypeScript Configuration

### `tsconfig.base.json` (root)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "exclude": ["node_modules", "dist"]
}
```

### Per-service `tsconfig.json` (e.g. `api/auth/tsconfig.json`)
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

For `packages/`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src"]
}
```

`composite: true` enables TypeScript project references — required for
Turborepo's incremental compilation to work correctly across packages.

---

## 5. Shared Packages

### `packages/types/package.json`
```json
{
  "name": "@elmariam/types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "*"
  }
}
```

### `packages/types/src/index.ts`
```typescript
// Shared domain types across all services

export interface User {
  id: string;
  username: string;
  email: string;
  userType: 'admin' | 'staff' | 'customer';
  id_number: string;
  createdAt: Date;
}

export interface TokenPayload {
  id: string;
  email: string;
  userType: User['userType'];
}

export interface BookingRequest {
  customerId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
}

export interface ApiError {
  success: false;
  status: number;
  data: {
    message: string;
    stack?: string;
  };
}
```

### `packages/utils/package.json`
```json
{
  "name": "@elmariam/utils",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "pino": "^8.19.0",
    "pino-pretty": "^11.0.0",
    "http-errors": "^2.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/http-errors": "^2.0.4",
    "@types/node": "^20.0.0",
    "typescript": "*"
  }
}
```

### `packages/utils/src/logger.ts`
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: { service: process.env.SERVICE_NAME ?? 'unknown' },
});

export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const id = crypto.randomUUID();
    req.requestId = id;
    req.log = logger.child({ requestId: id });
    res.setHeader('X-Request-Id', id);
    req.log.info({ method: req.method, url: req.url }, 'incoming request');
    next();
  };
}
```

### `packages/utils/src/errors.ts`
```typescript
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';

export { createHttpError as createError };

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({
    success: false,
    status,
    data: {
      message: err.message ?? 'Internal server error',
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    },
  });
}
```

### `packages/utils/src/validate.ts`
```typescript
import { z, ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { createError } from './errors.js';

export { z };

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        createError(400, result.error.errors.map((e) => e.message).join(', ')),
      );
    }
    req.body = result.data;
    next();
  };
}
```

### `packages/utils/src/index.ts`
```typescript
export * from './logger.js';
export * from './errors.js';
export * from './validate.js';
```

---

## 6. Docker Strategy — `turbo prune`

`turbo prune --scope=<service> --docker` generates a minimal workspace
snapshot in `out/` containing only the selected service and its workspace
dependencies. This is the canonical Turborepo Docker pattern.

### Build flow (from repo root)
```bash
pnpm turbo prune --scope=auth --docker
docker build \
  -t ranckosolutionsinc/elmariam-auth:1.0.0 \
  -f api/auth/Dockerfile \
  out/
rm -rf out/
```

### Service Dockerfile (`api/auth/Dockerfile`)
```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Stage 1: install deps from pruned lockfile ──────────────
FROM base AS deps
WORKDIR /repo
# turbo prune outputs json/ (package.json files only) and full/ (source too)
COPY out/json/ .
COPY out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ──────────────────────────────────────────
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY out/full/ .
RUN pnpm turbo run build --filter=auth

# ── Stage 3: runtime ────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /repo/api/auth/dist ./dist
COPY --from=builder /repo/api/auth/package.json .

USER appuser
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index.js"]
```

### Individual directory build (standalone script per service)

`api/auth/docker-build.sh`:
```bash
#!/usr/bin/env bash
# Run from any directory — always resolves to repo root
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
TAG=${1:-latest}
cd "$ROOT"
pnpm turbo prune --scope=auth --docker
docker build \
  -t ranckosolutionsinc/elmariam-auth:"$TAG" \
  -f api/auth/Dockerfile \
  out/
rm -rf out/
echo "Built ranckosolutionsinc/elmariam-auth:$TAG"
```

Usage: `cd api/auth && bash docker-build.sh 1.2.0`

### Root `.dockerignore`
```
.git
.github
node_modules
**/node_modules
**/.env
**/*.env
**/dist
.build
out
*.md
.justfile
```

---

## 7. Updated `.justfile`

```just
# ── Config ───────────────────────────────────────────────────
registry := "ranckosolutionsinc"
version  := "1.0.0"

default:
  just --list

# ── Install ──────────────────────────────────────────────────
install:
  pnpm install
  cd checkout && bun install

# ── Build (TypeScript, all services) ─────────────────────────
build:
  pnpm turbo run build

build-service service:
  pnpm turbo run build --filter={{service}}

# ── Lint & Test ──────────────────────────────────────────────
lint:
  pnpm turbo run lint

test:
  pnpm turbo run test

# ── Docker: internal helper ───────────────────────────────────
_prune-and-build service tag:
  pnpm turbo prune --scope={{service}} --docker
  docker build \
    -t {{registry}}/elmariam-{{service}}:{{tag}} \
    -f api/{{service}}/Dockerfile \
    out/
  rm -rf out/

# ── Docker: API services ─────────────────────────────────────
build-auth    tag=version: (_prune-and-build "auth"    tag)
build-hotel   tag=version: (_prune-and-build "hotel"   tag)
build-bar     tag=version: (_prune-and-build "bar"     tag)
build-sms     tag=version: (_prune-and-build "sms"     tag)
build-smtp    tag=version: (_prune-and-build "smtp"    tag)

# ── Docker: UI (no shared packages, build from service dir) ──
build-ui-admin tag=version:
  docker build -t {{registry}}/elmariam-admin-panel:{{tag}} ui/admin/

build-ui-user tag=version:
  docker build -t {{registry}}/elmariam-user-panel:{{tag}} ui/user/

build-ui-web tag=version:
  docker build -t {{registry}}/elmariam-website:{{tag}} ui/web/

# ── Docker: Checkout (Bun — standalone) ──────────────────────
build-checkout tag=version:
  docker build -t {{registry}}/elmariam-checkout:{{tag}} checkout/

# ── Docker: Gateway ──────────────────────────────────────────
build-gateway tag=version:
  docker build -t {{registry}}/elmariam-api-gateway:{{tag}} gateway/

# ── Docker: Build everything ─────────────────────────────────
build-all tag=version: \
  (build-auth       tag) \
  (build-hotel      tag) \
  (build-bar        tag) \
  (build-sms        tag) \
  (build-smtp       tag) \
  (build-ui-admin   tag) \
  (build-ui-user    tag) \
  (build-ui-web     tag) \
  (build-checkout   tag) \
  (build-gateway    tag)

# ── Push ─────────────────────────────────────────────────────
push service tag=version:
  docker push {{registry}}/elmariam-{{service}}:{{tag}}

push-all tag=version:
  just push auth       {{tag}}
  just push hotel      {{tag}}
  just push bar        {{tag}}
  just push sms        {{tag}}
  just push smtp       {{tag}}
  just push admin-panel {{tag}}
  just push user-panel  {{tag}}
  just push website     {{tag}}
  just push checkout   {{tag}}
  just push api-gateway {{tag}}

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

# ── Network ───────────────────────────────────────────────────
create-network:
  docker network create elmariam
```

---

## 8. GitHub Actions

### `.github/workflows/ci.yml` — Change detection + matrix dispatch
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── Step 1: detect which services changed ──────────────────
  detect-changes:
    name: Detect changed services
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.filter.outputs.changes }}
      any_changed: ${{ steps.filter.outputs.any_changed }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            auth:
              - 'api/auth/**'
              - 'packages/**'
            hotel:
              - 'api/hotel/**'
              - 'packages/**'
            bar:
              - 'api/bar/**'
              - 'packages/**'
            sms:
              - 'sms/**'
              - 'packages/**'
            smtp:
              - 'smtp/**'
              - 'packages/**'
            checkout:
              - 'checkout/**'
            ui-admin:
              - 'ui/admin/**'
            ui-user:
              - 'ui/user/**'
            ui-web:
              - 'ui/web/**'
            gateway:
              - 'gateway/**'

  # ── Step 2: build only changed services ────────────────────
  build-services:
    name: Build ${{ matrix.service }}
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.services != '[]' && needs.detect-changes.outputs.services != '' }}
    strategy:
      fail-fast: false
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
    uses: ./.github/workflows/_service-build.yml
    with:
      service: ${{ matrix.service }}
      push_image: ${{ github.ref == 'refs/heads/main' }}
    secrets: inherit
```

### `.github/workflows/_service-build.yml` — Reusable build job
```yaml
name: Service Build (reusable)

on:
  workflow_call:
    inputs:
      service:
        description: Service name (matches pnpm filter name)
        required: true
        type: string
      push_image:
        description: Whether to push the image to the registry
        required: false
        type: boolean
        default: false
      tag:
        description: Image tag override (defaults to git sha short)
        required: false
        type: string
        default: ''

jobs:
  build:
    name: Build ${{ inputs.service }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # Determine image tag: explicit input > git sha
      - name: Resolve image tag
        id: tag
        run: |
          TAG="${{ inputs.tag }}"
          if [ -z "$TAG" ]; then
            TAG="${GITHUB_SHA::8}"
          fi
          echo "value=$TAG" >> "$GITHUB_OUTPUT"

      # API services: prune workspace, build TypeScript, then Docker
      - name: Prune workspace (API services)
        if: ${{ !startsWith(inputs.service, 'ui-') && inputs.service != 'checkout' && inputs.service != 'gateway' }}
        run: pnpm turbo prune --scope=${{ inputs.service }} --docker

      - name: Lint
        if: ${{ !startsWith(inputs.service, 'ui-') && inputs.service != 'checkout' && inputs.service != 'gateway' }}
        run: pnpm turbo run lint --filter=${{ inputs.service }}

      - name: Test
        if: ${{ !startsWith(inputs.service, 'ui-') && inputs.service != 'checkout' && inputs.service != 'gateway' }}
        run: pnpm turbo run test --filter=${{ inputs.service }}

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        if: inputs.push_image
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # API services use pruned context
      - name: Build & push (API service)
        if: ${{ !startsWith(inputs.service, 'ui-') && inputs.service != 'checkout' && inputs.service != 'gateway' }}
        uses: docker/build-push-action@v5
        with:
          context: out/
          file: api/${{ inputs.service }}/Dockerfile
          push: ${{ inputs.push_image }}
          tags: |
            ranckosolutionsinc/elmariam-${{ inputs.service }}:${{ steps.tag.outputs.value }}
            ranckosolutionsinc/elmariam-${{ inputs.service }}:latest
          cache-from: type=gha,scope=${{ inputs.service }}
          cache-to: type=gha,mode=max,scope=${{ inputs.service }}

      # UI services: build directly from service directory
      - name: Build & push (UI)
        if: ${{ startsWith(inputs.service, 'ui-') }}
        uses: docker/build-push-action@v5
        with:
          context: ui/${{ replace(inputs.service, 'ui-', '') }}/
          push: ${{ inputs.push_image }}
          tags: |
            ranckosolutionsinc/elmariam-${{ inputs.service }}:${{ steps.tag.outputs.value }}
            ranckosolutionsinc/elmariam-${{ inputs.service }}:latest
          cache-from: type=gha,scope=${{ inputs.service }}
          cache-to: type=gha,mode=max,scope=${{ inputs.service }}

      # Checkout: standalone Bun service
      - name: Build & push (checkout)
        if: ${{ inputs.service == 'checkout' }}
        uses: docker/build-push-action@v5
        with:
          context: checkout/
          push: ${{ inputs.push_image }}
          tags: |
            ranckosolutionsinc/elmariam-checkout:${{ steps.tag.outputs.value }}
            ranckosolutionsinc/elmariam-checkout:latest
          cache-from: type=gha,scope=checkout
          cache-to: type=gha,mode=max,scope=checkout

      # Gateway: static config only
      - name: Build & push (gateway)
        if: ${{ inputs.service == 'gateway' }}
        uses: docker/build-push-action@v5
        with:
          context: gateway/
          push: ${{ inputs.push_image }}
          tags: |
            ranckosolutionsinc/elmariam-api-gateway:${{ steps.tag.outputs.value }}
            ranckosolutionsinc/elmariam-api-gateway:latest
          cache-from: type=gha,scope=gateway
          cache-to: type=gha,mode=max,scope=gateway
```

### `.github/workflows/release.yml` — Tag push + manual full rebuild
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      services:
        description: Comma-separated list of services to build (leave empty for all)
        required: false
        default: ''
      tag:
        description: Image tag to apply
        required: false
        default: ''

jobs:
  resolve-services:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.resolve.outputs.matrix }}
    steps:
      - id: resolve
        run: |
          INPUT="${{ github.event.inputs.services }}"
          ALL='["auth","hotel","bar","sms","smtp","checkout","ui-admin","ui-user","ui-web","gateway"]'
          if [ -z "$INPUT" ]; then
            echo "matrix=$ALL" >> "$GITHUB_OUTPUT"
          else
            # Convert comma-separated to JSON array
            JSON=$(echo "$INPUT" | jq -Rc 'split(",")')
            echo "matrix=$JSON" >> "$GITHUB_OUTPUT"
          fi

  release:
    needs: resolve-services
    strategy:
      fail-fast: false
      matrix:
        service: ${{ fromJson(needs.resolve-services.outputs.matrix) }}
    uses: ./.github/workflows/_service-build.yml
    with:
      service: ${{ matrix.service }}
      push_image: true
      tag: ${{ github.event.inputs.tag || github.ref_name }}
    secrets: inherit
```

---

## 9. TypeScript Migration Order

Migrate one service at a time. Each conversion is a separate PR.

### Order (simplest → most complex)
1. `packages/types` + `packages/utils` — foundational, no runtime deps
2. `api/auth` — fewest dependencies, bugs already identified
3. `smtp` — small, nearly standalone
4. `sms` — similar size to smtp
5. `api/hotel` — medium complexity
6. `api/bar` — most complex service
7. `ui/*` — Svelte already supports TypeScript natively

### Migration checklist per service
- [ ] Add `tsconfig.json` extending `../../tsconfig.base.json`
- [ ] Add `typescript` to devDependencies, add `@types/*` for deps
- [ ] Add `"build": "tsc"` script
- [ ] Rename `src/**/*.js` → `src/**/*.ts`
- [ ] Fix type errors (start with `strict: false`, tighten later)
- [ ] Replace `console.log` with `@elmariam/utils` logger
- [ ] Replace manual error handling with `@elmariam/utils` errorHandler
- [ ] Add `zod` schemas for request bodies using `@elmariam/utils` validateBody
- [ ] Add `/health` endpoint
- [ ] Add `helmet()` middleware
- [ ] Update Dockerfile to compile TS before building image

---

## 10. Production Improvements Bundled with This Track

### Security (do before first deploy)
- [ ] Replace real JWT secrets in `.env.sample` with `YOUR_SECRET_HERE`
- [ ] Add `helmet` to all Express services
- [ ] Fix `mongoose.set("strictQuery", false)` → `true` in auth and hotel
- [ ] Add `express-rate-limit` to auth service login/register routes
- [ ] Fix SMTP `noAck: true` → `false` + add retry logic

### Bug fixes (do in first PR per service)
- [ ] Auth: `expired_at.setDate(getDate() + 7)` — currently sets to today
- [ ] Auth: replace JWT `verify` callback with try/catch
- [ ] Hotel: fix `errors.length` check on a plain object
- [ ] Hotel: fix `messsage` typo in error response
- [ ] Bar: fix `saleID` vs `salesId` variable name mismatch
- [ ] Bar: remove or implement the stub `lipaNaMpesa` route

### Observability
- [ ] Add `/health` endpoint to every service
- [ ] Add `HEALTHCHECK` to every Dockerfile
- [ ] Add `@elmariam/utils` logger replacing all `console.log` calls
- [ ] Thread `requestId` through all log entries and error responses

### Validation
- [ ] Add `zod` schemas for auth register/login bodies
- [ ] Add `zod` schemas for hotel booking creation
- [ ] Add `zod` schemas for bar order creation
