FROM node:12.18.4-alpine AS base
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
# Expose port(s)
EXPOSE 4000
# Install dependencies and build
RUN yarn && yarn build:dev
# Start on excecution
CMD [ "yarn", "start:server" ]
