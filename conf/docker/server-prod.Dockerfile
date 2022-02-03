FROM node:14.17.1-alpine AS base
# Add a work directory, copy package.json for caching, copy app files
WORKDIR /app
ADD package.json yarn.lock ./
COPY . .

# Remove client files, except server.ts, to prevent duplication
RUN rm -rf client/build
RUN rm -rf client/node_modules
RUN rm -rf client/public
RUN find client/src -maxdepth 1 ! -path client/src/types ! -path client/src -type d -exec rm -rf {} +
RUN find client -type f -not -name 'server.ts' -delete

# Install perl, needed by exiftool, and git, needed to fetch npm-server-webdav
RUN apk update
RUN apk add perl
RUN apk add git

# Install dependencies and build production
WORKDIR /app
RUN yarn install --frozen-lockfile
RUN yarn build:prod

# Server's production image; add a work directory and copy from base
FROM node:14.17.1-alpine AS server
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/server ./server
COPY --from=base /app/client ./client

# Expose port, and provide start command on execution
EXPOSE 4000
CMD [ "node", "server/build/server/index.js" ]
