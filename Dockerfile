FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com

COPY app  $HOME/app
COPY package.json $HOME/package.json
COPY tsconfig.json $HOME/tsconfig.json


RUN npm install

ENTRYPOINT [ "sh", "-c", "echo $HOME; wait 1000; echo $HOME" ]

#ENTRYPOINT ["node", "./build/app.ts"]
