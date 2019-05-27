FROM mhart/alpine-node:10

MAINTAINER Matt Jones <matt@starchup.com>

# Install samba
RUN echo http://nl.alpinelinux.org/alpine/edge/community/ >> /etc/apk/repositories
RUN apk --no-cache --no-progress upgrade && \
    apk --no-cache --no-progress add s6 s6-portable-utils bash shadow samba && \
    rm -rf /var/cache/apk/*

COPY app/  $HOME/app/
COPY package.json $HOME/package.json
COPY tsconfig.json $HOME/tsconfig.json
COPY node_modules/ $HOME/node_modules/
COPY build/ $HOME/build/

#combined instance test stuff
COPY ./etc/ /etc/
COPY ./service/.s6-svscan/ /service/
COPY ./service/ /service/

RUN npm rebuild

#ENTRYPOINT ["node", "./build/app.js"]
CMD ["/etc/s6-linux-init/init"]
