FROM node:18.18.2-alpine AS build
WORKDIR /app
COPY . .
RUN npm i --silent
RUN npm run build

FROM nginx:1.25.3-alpine-slim
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/build .
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
ENTRYPOINT [ "nginx", "-g", "daemon off;" ]