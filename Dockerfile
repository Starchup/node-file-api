FROM mhart/alpine-node:8

MAINTAINER Matt Jones <matt@starchup.com>

COPY app/  $HOME/app/
COPY package.json $HOME/package.json
COPY tsconfig.json $HOME/tsconfig.json
COPY node_modules/ $HOME/node_modules/
COPY build/ $HOME/build/

RUN npm rebuild

ENTRYPOINT ["node", "./build/app.js"]
