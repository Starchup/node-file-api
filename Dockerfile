FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com

WORKDIR /app/

COPY package.json app/package.json
COPY tsconfig.json app/tsconfig.json


RUN npm install
RUN npm run dev
