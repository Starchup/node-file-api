FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com


COPY package.json app/package.json
COPY tsconfig.json

WORKDIR /app

RUN npm install

ENTRYPOINT ["node", "app/app.ts"]

