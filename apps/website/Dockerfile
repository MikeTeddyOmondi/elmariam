FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/auth/package.json packages/auth/
COPY apps/website/package.json apps/website/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY apps/website/ apps/website/
RUN pnpm --filter @elmariam/auth build
RUN pnpm --filter @elmariam/website build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /monorepo/apps/website/build ./build
EXPOSE 3002
CMD ["node", "build"]
