FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/queue/package.json packages/queue/
COPY infra/openauth/package.json infra/openauth/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY infra/openauth/ infra/openauth/
RUN pnpm --filter @elmariam/db build
# @elmariam/auth supplies the shared `subjects` and the role list the issuer
# validates against, so it must be built before the issuer compiles.
RUN pnpm --filter @elmariam/auth build
RUN pnpm --filter @elmariam/queue build
RUN pnpm --filter @elmariam/openauth build
RUN pnpm --filter @elmariam/openauth deploy --prod /standalone

FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=3100
EXPOSE 3100
CMD ["bun", "dist/index.js"]
