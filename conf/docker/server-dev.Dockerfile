FROM node:14.17.1-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package*.json .
# Copy app files
COPY . .

# Build server from common base
FROM base AS server
# Remove client to prevent duplication
RUN rm -rf client
# Install perl, needed by exiftool
RUN apk add perl
# Expose port(s)
EXPOSE 4000
# Install dependencies
WORKDIR /app
RUN yarn
# build
RUN yarn build:dev
# Start on excecution
CMD [ "yarn", "start:server" ]
