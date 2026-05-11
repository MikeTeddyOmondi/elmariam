FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=8004
EXPOSE 8004
CMD ["node", "-r", "ts-node/register", "src/index.ts"]
