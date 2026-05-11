FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=8005
EXPOSE 8005
CMD ["node", "-r", "ts-node/register", "src/index.ts"]
