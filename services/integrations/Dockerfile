FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/queue/package.json packages/queue/
COPY services/integrations/package.json services/integrations/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY services/integrations/ services/integrations/
RUN pnpm --filter @elmariam/queue build
RUN pnpm --filter @elmariam/integrations build && cp -r services/integrations/src/templates services/integrations/dist/
RUN pnpm --filter @elmariam/integrations deploy --prod /standalone

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=8010
EXPOSE 8010
CMD ["node", "dist/index.js"]
