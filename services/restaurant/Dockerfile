FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY services/restaurant/package.json services/restaurant/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY services/restaurant/ services/restaurant/
RUN pnpm --filter @elmariam/db build
RUN pnpm --filter @elmariam/auth build
RUN pnpm --filter @elmariam/restaurant build
RUN pnpm --filter @elmariam/restaurant deploy --prod /standalone

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=8005
EXPOSE 8005
CMD ["node", "dist/index.js"]
