FROM node:14.17.1-alpine AS base
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
FROM node:14.17.1-alpine AS server
WORKDIR /app

# Install perl, needed by exiftool
RUN apk update
RUN apk add perl

COPY --from=base /app/server ./server
COPY --from=base /app/common ./common
COPY --from=base /app/node_modules ./node_modules
RUN mkdir -p /app/node_modules/@dpo-packrat/ && ln -s /app/common /app/node_modules/@dpo-packrat/common

# Expose port, and provide start command on execution
EXPOSE 4000
CMD [ "node", "server/build/index.js" ]
