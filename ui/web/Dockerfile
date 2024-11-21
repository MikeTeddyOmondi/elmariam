FROM node:18.18.2-alpine AS build
WORKDIR /app
COPY . .
RUN npm i --silent
RUN npm run build

FROM lipanski/docker-static-website:2.4.0 as release
COPY --from=build /app/build .

