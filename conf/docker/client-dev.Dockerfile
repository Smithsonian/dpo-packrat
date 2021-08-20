FROM node:14.17.1-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package*.json .
# Copy app files
COPY . .

# Build client from common base
FROM base AS client
# Remove server to prevent duplication
RUN rm -rf server
# Expose port(s)
EXPOSE 3000
# Install dependencies and build
RUN yarn && yarn build:dev
# Start on excecution
CMD [ "yarn", "start:client" ]