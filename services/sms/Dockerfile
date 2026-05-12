FROM node:20-alpine AS builder
WORKDIR /monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/queue/package.json packages/queue/
COPY services/sms/package.json services/sms/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/ packages/
COPY services/sms/ services/sms/
RUN pnpm --filter @elmariam/queue build
RUN pnpm --filter @elmariam/sms build
RUN pnpm --filter @elmariam/sms deploy --prod /standalone

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /standalone .
ENV PORT=7879
EXPOSE 7879
CMD ["node", "dist/index.js"]
