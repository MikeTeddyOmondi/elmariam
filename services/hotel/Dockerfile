FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=8003
EXPOSE 8003
CMD ["node", "-r", "ts-node/register", "src/index.ts"]
