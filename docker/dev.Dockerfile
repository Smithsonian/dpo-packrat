FROM node:12.18.4-alpine AS base
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
RUN yarn && yarn build
# Start on excecution
CMD [ "yarn", "start:client" ]

# Build server from common base
FROM base AS server
# Remove client to prevent duplication
RUN rm -rf client
# Expose port(s)
EXPOSE 4000
# Install dependencies and build
RUN yarn && yarn build
# Start on excecution
CMD [ "yarn", "start:server" ]

FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]

FROM mariadb:10.5 as db

FROM solr:8 as solr
COPY --chown=solr:solr ./server/config/solr/data/packrat/ /var/solr/data/packrat/
