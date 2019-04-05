FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com


COPY package.json $HOME/package.json
COPY tsconfig.json $HOME/tsconfig.json

#WORKDIR app

RUN npm install
RUN npm run dev
