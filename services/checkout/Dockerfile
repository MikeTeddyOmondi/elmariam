FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/queue/package.json packages/queue/
COPY services/checkout/package.json services/checkout/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY services/checkout/ services/checkout/
RUN pnpm --filter @elmariam/queue build
RUN pnpm --filter @elmariam/checkout build
RUN pnpm --filter @elmariam/checkout deploy --prod /standalone

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=8008
EXPOSE 8008
CMD ["node", "dist/index.js"]
