FROM node:14.17.1-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package.json yarn.lock ./
# Copy app files
COPY . .

# Build server from common base
FROM base AS server-builder
# Remove client files, except server.ts, to prevent duplication
RUN rm -rf client/build
RUN rm -rf client/node_modules
RUN rm -rf client/public
RUN find client/src -maxdepth 1 ! -path client/src/types ! -path client/src -type d -exec rm -rf {} +
RUN find client -type f -not -name 'server.ts' -delete
# Install git, needed to fetch npm-server-webdav
RUN apk update
RUN apk add git
# Install dependencies (production mode) and build
RUN yarn install --frozen-lockfile && yarn build:prod

# Server's production image
FROM node:14.17.1-alpine AS server
# Add a work directory
WORKDIR /app
# Copy from server-builder
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
# Expose port(s)
EXPOSE 4000
# Start on excecution
CMD [ "node", "server/build/index.js" ]
