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

FROM base AS server-builder
# Remove client from server build
RUN rm -rf client
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

# Server's production image
FROM node:12.18.4-alpine AS server
# Add a work directory
WORKDIR /app
# Copy from server-builder
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
# Expose port(s)
EXPOSE 4000
# Start on excecution
CMD [ "node", "server/build/index.js" ]

FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]

FROM solr:8 as solr
COPY --chown=solr:solr ./server/config/solr/data/packrat/ /var/solr/data/packrat/
