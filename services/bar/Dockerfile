FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/queue/package.json packages/queue/
COPY services/bar/package.json services/bar/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY services/bar/ services/bar/
RUN pnpm --filter @elmariam/db build
RUN pnpm --filter @elmariam/auth build
RUN pnpm --filter @elmariam/queue build
RUN pnpm --filter @elmariam/bar build
RUN pnpm --filter @elmariam/bar deploy --prod /standalone

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=8004
EXPOSE 8004
CMD ["node", "dist/index.js"]
