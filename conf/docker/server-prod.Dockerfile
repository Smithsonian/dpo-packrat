FROM node:18.9.0-alpine AS base
# Add a work directory, copy package.json for caching, copy app files
WORKDIR /app
ADD package.json yarn.lock ./
COPY . .

# Remove client to prevent duplication
RUN rm -rf client

# Install git, needed to fetch npm-server-webdav
RUN apk update
RUN apk add git

# Install dependencies and build production
RUN yarn install --frozen-lockfile
RUN yarn build:prod

# Server's production image; add a work directory and copy from base
FROM node:18.9.0-alpine AS server
WORKDIR /app

# Install perl, needed by exiftool
RUN apk update
RUN apk add perl
RUN apk add bash

# certificate packages and update
RUN apk add --no-cache ca-certificates && update-ca-certificates
RUN update-ca-certificates

# copy our files over and setup file system
COPY --from=base /app/server ./server
COPY --from=base /app/common ./common
COPY --from=base /app/node_modules ./node_modules
RUN mkdir -p /app/node_modules/@dpo-packrat/ && rm /app/node_modules/@dpo-packrat/common && ln -s /app/common/build /app/node_modules/@dpo-packrat/common

# cleanup from APK actions
RUN rm -rf /var/cache/apk/*

# Expose port, and provide start command on execution
EXPOSE 4000
CMD [ "node", "--max-old-space-size=14336", "server/build/index.js" ]
