FROM oven/bun:1.1-alpine
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .
ENV PORT=8008
EXPOSE 8008
CMD ["bun", "run", "src/index.ts"]
