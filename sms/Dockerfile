FROM node:18.18.2-alpine

WORKDIR /app

COPY package*.json /app/

RUN npm install --silent

ARG NODE_ENV

RUN if [ "$NODE_ENV" = "development" ]; \
        then npm install; \
        else npm install --only=production; \
        fi

COPY . /app/

USER 1000

ENV PORT 7879

EXPOSE $PORT

CMD ["node", "./index.js"]
