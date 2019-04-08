FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com

COPY app  $HOME/app
COPY package.json $HOME/package.json
COPY tsconfig.json $HOME/tsconfig.json
COPY node_modules $HOME/node_modules
COPY build $HOME/build


ENTRYPOINT ["node", "/build/app.ts"]
