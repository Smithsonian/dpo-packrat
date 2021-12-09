FROM node:14.17.1-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package.json yarn.lock ./
# Copy app files
COPY . .

FROM base AS server-builder
# Remove client from server build
RUN rm -rf client
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
