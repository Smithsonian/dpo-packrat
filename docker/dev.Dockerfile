FROM node:12-alpine AS base
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
RUN yarn

# Build server from common base
FROM base AS server
# Remove client to prevent duplication
RUN rm -rf client
# Expose port(s)
EXPOSE 4000
# Install dependencies and build
RUN yarn

FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]

FROM mariadb:10.5 as db
