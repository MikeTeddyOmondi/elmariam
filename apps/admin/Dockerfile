FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/auth/package.json packages/auth/
COPY apps/admin/package.json apps/admin/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY apps/admin/ apps/admin/
RUN pnpm --filter @elmariam/auth build
RUN pnpm --filter @elmariam/admin build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /monorepo/apps/admin/build ./build
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
