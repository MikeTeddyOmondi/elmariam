# Track C — Full Power Monorepo

**Profile:** Maximum tooling, maximum control. Best for a growing team, large codebase, or when Nx's generator/affected graph capabilities justify the setup cost.

---

## Summary

| Axis | Choice |
|---|---|
| Workspace | pnpm + Nx |
| TypeScript | Full rewrite (one service at a time, but fully converted) |
| Docker | `turbo prune` or `nx affected` with custom executors |
| CI/CD | Single workflow using `nx affected` for dependency-graph-aware builds |
| Effort | ~4–8 weeks |

---

## 1. Why Nx Over Turborepo

| Feature | Turborepo (Track B) | Nx (Track C) |
|---|---|---|
| Task pipeline caching | Yes | Yes (faster local cache) |
| Remote cache | Vercel (or self-host) | Nx Cloud (free tier) or self-host |
| Affected detection | `--filter=[HEAD^1]` | `nx affected` (uses actual import graph) |
| Code generators | No | Yes — scaffold new services with `nx g` |
| Project graph UI | No | Yes — `nx graph` visual dependency viewer |
| Migrations | Manual | `nx migrate` for automated upgrades |
| Learning curve | Low | Medium-high |
| Config overhead | Low | Medium |

**When Track C makes sense:**
- Team of 3+ developers working on the monorepo simultaneously
- You want `nx g @nx/node:app restaurant` to scaffold the missing restaurant service
- You need the import graph (not just file paths) to determine what to rebuild
- You want Nx Cloud remote caching to share build artifacts across machines

---

## 2. Repository Structure

```
elmariam/
├── .github/
│   └── workflows/
│       ├── ci.yml                # nx affected --base=origin/main
│       └── release.yml           # tag-triggered, calls affected or explicit list
├── apps/                         # renamed from api/ and ui/ — Nx convention
│   ├── auth/
│   ├── hotel/
│   ├── bar/
│   ├── restaurant/               # scaffolded with nx g
│   ├── sms/
│   ├── smtp/
│   ├── admin/                    # formerly ui/admin
│   ├── user-panel/               # formerly ui/user
│   └── web/                      # formerly ui/web
├── libs/                         # renamed from packages/ — Nx convention
│   ├── types/                    # @elmariam/types
│   └── utils/                    # @elmariam/utils
├── checkout/                     # Bun — excluded from Nx workspace
├── gateway/
├── proxy/
├── nx.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── .justfile
```

---

## 3. Nx Configuration

### `nx.json`
```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json"
    ]
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production"],
      "cache": true
    },
    "docker-build": {
      "dependsOn": ["build"],
      "cache": false
    }
  },
  "defaultBase": "main"
}
```

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'libs/*'
  # checkout excluded — Bun
```

### Root `package.json`
```json
{
  "name": "elmariam",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "nx run-many -t build",
    "lint": "nx run-many -t lint",
    "test": "nx run-many -t test",
    "affected:build": "nx affected -t build",
    "affected:test": "nx affected -t test",
    "graph": "nx graph"
  },
  "devDependencies": {
    "nx": "^19.0.0",
    "@nx/node": "^19.0.0",
    "@nx/js": "^19.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 4. Scaffolding New Services with Nx

Instead of copying boilerplate, generate services:

```bash
# Generate the missing restaurant service
pnpm nx g @nx/node:app restaurant \
  --directory=apps/restaurant \
  --framework=express \
  --unitTestRunner=vitest

# Generate a new shared library
pnpm nx g @nx/js:lib auth-contracts \
  --directory=libs/auth-contracts \
  --bundler=tsc
```

---

## 5. Docker Strategy — Nx + Custom Targets

Each app defines a `docker-build` target in its `project.json`:

### `apps/auth/project.json`
```json
{
  "name": "auth",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/auth",
        "tsConfig": "apps/auth/tsconfig.json",
        "main": "apps/auth/src/index.ts"
      }
    },
    "docker-build": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "docker build -t ranckosolutionsinc/elmariam-auth:{args.tag} -f apps/auth/Dockerfile dist/apps/auth",
        "cwd": "{workspaceRoot}"
      }
    }
  }
}
```

### Build a single service
```bash
pnpm nx docker-build auth --args="tag=1.2.0"
```

### Build only affected services (e.g. after changing libs/utils)
```bash
pnpm nx affected -t docker-build --base=main --head=HEAD
```

---

## 6. GitHub Actions — Nx Affected

```yaml
# .github/workflows/ci.yml
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
  main:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # nx affected needs full history

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # nx affected uses the actual import graph, not file paths
      - name: Set NX base SHA
        uses: nrwl/nx-set-shas@v4

      - name: Lint affected
        run: pnpm nx affected -t lint --base=$NX_BASE --head=$NX_HEAD

      - name: Test affected
        run: pnpm nx affected -t test --base=$NX_BASE --head=$NX_HEAD

      - name: Build affected
        run: pnpm nx affected -t build --base=$NX_BASE --head=$NX_HEAD

      - uses: docker/login-action@v3
        if: github.ref == 'refs/heads/main'
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Docker build affected (main only)
        if: github.ref == 'refs/heads/main'
        run: pnpm nx affected -t docker-build --base=$NX_BASE --head=$NX_HEAD
```

### Release workflow
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      projects:
        description: 'Projects to release (comma-separated, empty = all)'
        required: false
        default: ''

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push all (tag push)
        if: github.event_name == 'push'
        run: pnpm nx run-many -t docker-build --all

      - name: Build and push specific projects (manual)
        if: github.event_name == 'workflow_dispatch' && github.event.inputs.projects != ''
        run: |
          pnpm nx run-many -t docker-build \
            --projects=${{ github.event.inputs.projects }}

      - name: Build and push all (manual, no projects specified)
        if: github.event_name == 'workflow_dispatch' && github.event.inputs.projects == ''
        run: pnpm nx run-many -t docker-build --all
```

---

## 7. TypeScript Migration — Full Rewrite Per Service

Unlike Track A's incremental approach, Track C converts each service completely
before moving to the next. Nx generators do most of the scaffolding.

### Migration steps per service
1. `nx g @nx/node:app <name>` generates the target structure
2. Copy existing logic into generated scaffold
3. Apply all production fixes at conversion time (validation, logging, etc.)
4. Write tests for the converted code before merging
5. Remove old JS service, redirect imports

This is more disruptive but produces a fully typed codebase faster.

---

## 8. Nx Cloud (Optional Remote Caching)

```bash
pnpm nx connect-to-nx-cloud
```

Once configured, CI machines share a remote task cache. A CI run where
`libs/utils` hasn't changed will restore all dependent service builds from
cache in seconds rather than recompiling them.

Free tier: 500 hours/month of compute saved.

---

## 9. `nx graph`

```bash
pnpm nx graph
```

Opens a visual browser UI showing which apps depend on which libs. Clicking a
node shows its full dependency tree. Invaluable for understanding blast radius
before changing a shared library.

---

## 10. Production Improvements

Same list as Track B — all items apply equally here. See Track B section 10.
The difference is that in Track C, each Nx migration generates correct structure
automatically, so some setup items (tsconfig, test runner, lint config) are
handled by the generator rather than manually.

---

## Trade-offs vs Track B

| | Track B | Track C |
|---|---|---|
| Setup time | ~2–4 weeks | ~4–8 weeks |
| Ongoing DX | Good | Excellent |
| New service scaffolding | Manual copy | `nx g` generator |
| Affected detection | File path based | Import graph based |
| Remote cache | Optional (Vercel) | Nx Cloud (easier) |
| Visual dependency graph | No | Yes (`nx graph`) |
| Team size fit | 1–4 devs | 3+ devs |
| Risk of over-engineering | Low | Medium |
