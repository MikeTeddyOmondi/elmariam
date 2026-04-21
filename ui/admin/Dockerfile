FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Stage 1: install from pruned lockfile ────────────────────
FROM base AS deps
WORKDIR /repo
COPY out/json/ .
COPY out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ── Stage 2: vite build ───────────────────────────────────────
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY out/full/ .
RUN pnpm turbo run build --filter=@elmariam/admin

# ── Stage 3: nginx runtime ────────────────────────────────────
FROM nginx:bookworm-slim AS runner
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /repo/ui/admin/build .
COPY ui/admin/nginx/nginx.conf /etc/nginx/conf.d/default.conf
ENTRYPOINT ["nginx", "-g", "daemon off;"]
