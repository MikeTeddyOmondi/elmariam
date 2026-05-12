FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/queue/package.json packages/queue/
COPY services/smtp/package.json services/smtp/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY services/smtp/ services/smtp/
RUN pnpm --filter @elmariam/queue build
RUN pnpm --filter @elmariam/smtp build && cp -r services/smtp/src/templates services/smtp/dist/
RUN pnpm --filter @elmariam/smtp deploy --prod /standalone

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=3300
EXPOSE 3300
CMD ["node", "dist/index.js"]
