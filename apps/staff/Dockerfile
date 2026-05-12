FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/auth/package.json packages/auth/
COPY apps/staff/package.json apps/staff/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY apps/staff/ apps/staff/
RUN pnpm --filter @elmariam/auth build
RUN pnpm --filter @elmariam/staff build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /monorepo/apps/staff/build ./build
EXPOSE 3001
CMD ["node", "build"]
