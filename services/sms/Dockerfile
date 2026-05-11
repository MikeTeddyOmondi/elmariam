FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=7879
EXPOSE 7879
CMD ["node", "-r", "ts-node/register", "src/index.ts"]
