FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=3300
EXPOSE 3300
CMD ["node", "-r", "ts-node/register", "src/index.ts"]
