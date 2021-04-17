FROM node:12.18.4-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package.json yarn.lock ./
# Copy app files
COPY . .

FROM base AS client-builder
# Remove server from client build
RUN rm -rf server
# Install dependencies (production mode) and build
RUN yarn install --frozen-lockfile && yarn build:prod

# Client's production image
FROM node:12.18.4-alpine AS client
# Add a work directory
WORKDIR /app
# Copy from client-builder
COPY --from=client-builder /app/client/build .
# Expose port(s)
EXPOSE 3000
# Install static file server
RUN npm i -g serve
# Start on excecution
CMD serve -s . -l 3000
