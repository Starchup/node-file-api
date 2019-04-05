FROM mhart/alpine-node:6.5

MAINTAINER matt@starchup.com




RUN npm install


RUN npm run dev
