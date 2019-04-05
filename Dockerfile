FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com

WORKDIR /app/

COPY package.json $HOME/package.json


RUN npm install
RUN npm run dev
