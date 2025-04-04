FROM node:18.9.0-alpine AS server

# Add a work directory, copy package.json for caching, copy app files
WORKDIR /app
ADD package.json .
COPY . .

# Remove client to prevent duplication
RUN rm -rf client

# Install perl, needed by exiftool, and git, needed to fetch npm-server-webdav
RUN apk update
RUN apk add perl
RUN apk add git
RUN apk add bash

# Debugging packages
RUN apk add --no-cache openssl
RUN apk add --no-cache openldap-clients

# certificate packages and update
RUN apk add --no-cache ca-certificates && update-ca-certificates
RUN update-ca-certificates

# add our CA script with rights
#COPY ./conf/scripts/update-ca.sh /etc/ssl/update-ca.sh
#RUN chmod +x /etc/ssl/update-ca.sh

# setup logging and echoing directly into root's crontab
#RUN apk add dcron
#RUN touch /var/log/cron.log
#RUN echo "*/20 * * * * /etc/ssl/update-ca.sh" >> /etc/crontabs/root

# Run crond with log level 8 in foreground, output log to stdout
#RUN crond -l 8 -f

# cleanup from APK actions
RUN rm -rf /var/cache/apk/*

# Install dependencies and build development
RUN mkdir -p /app/node_modules/@dpo-packrat/ && ln -s /app/common /app/node_modules/@dpo-packrat/common
RUN yarn --frozen-lockfile
RUN yarn build:dev

# Expose port, and provide start command on execution
EXPOSE 4000
CMD [ "yarn", "start:server" ]

# TODO: run cron to update certs and start server. resultsd in 502 gateway error
#CMD crond -l 8 -f && yarn start:server