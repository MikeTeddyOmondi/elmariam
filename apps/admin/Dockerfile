FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/queue/package.json packages/queue/
COPY packages/ui/package.json packages/ui/
COPY apps/admin/package.json apps/admin/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY apps/admin/ apps/admin/
RUN pnpm --filter @elmariam/auth build
RUN pnpm --filter @elmariam/db build
RUN pnpm --filter @elmariam/queue build
RUN pnpm --filter @elmariam/admin build
RUN pnpm --filter @elmariam/admin deploy --prod /standalone

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=3000
ENV ORIGIN=http://localhost:3000
EXPOSE 3000
CMD ["node", "build"]
