FROM node:14.17.1-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package*.json .
# Copy app files
COPY . .

# Build server from common base
FROM base AS server
# Remove client files, except server.ts, to prevent duplication
RUN rm -rf client/build
RUN rm -rf client/node_modules
RUN rm -rf client/public
RUN find client/src -maxdepth 1 ! -path client/src/types ! -path client/src -type d -exec rm -rf {} +
RUN find client -type f -not -name 'server.ts' -delete
# Install perl, needed by exiftool
RUN apk update
RUN apk add perl
# Install git, needed to fetch npm-server-webdav
RUN apk add git
# Expose port(s)
EXPOSE 4000
# Install dependencies
WORKDIR /app
RUN yarn
# build
RUN yarn build:dev
# Start on excecution
CMD [ "yarn", "start:server" ]
