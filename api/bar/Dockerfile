# syntax=docker/dockerfile:1
# Build stage: node:22-bookworm-slim (1 upstream CVE in Node binary — not yet patched
# in any Node 22 release; build stages are ephemeral and never deployed).
# Runner stage: distroless/nodejs22-debian12 — clean, zero CVEs, ships to production.
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Stage 1: install from pruned lockfile ────────────────────
FROM base AS deps
WORKDIR /repo
COPY out/json/ .
COPY out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ── Stage 2: compile TypeScript ──────────────────────────────
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY out/full/ .
RUN pnpm turbo run build --filter=@elmariam/bar

# ── Stage 3: distroless runtime ──────────────────────────────
FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

COPY --from=builder /repo/api/bar/dist ./dist
COPY --from=builder /repo/api/bar/package.json .

USER nonroot
ENV NODE_ENV=production
ENV PORT=8004
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:' + process.env.PORT + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]

CMD ["dist/index.js"]
