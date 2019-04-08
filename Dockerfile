FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com

COPY app  $HOME/app
COPY package.json $HOME/package.json
COPY tsconfig.json $HOME/tsconfig.json

 RUN npm install -g typescript@1.8.2


RUN npm install
RUN tsc

ENTRYPOINT ["node", "./build/app.ts"]
