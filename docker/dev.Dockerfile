FROM node:12-alpine AS base
# Copy package.json for caching
ADD package*.json ./
# Add a work directory
WORKDIR /app
# Copy app files
COPY . /app
# Install dependencies
RUN yarn

# Build client from common base
FROM base AS client
# Remove server to prevent duplication
RUN rm -rf server
# Expose port(s)
EXPOSE 3000
# Build
RUN yarn build
# Start on excecution
CMD [ "yarn", "start:client" ]

# Build server from common base
FROM base AS server
# Remove client to prevent duplication
RUN rm -rf client
# Expose port(s)
EXPOSE 4000
# Build
RUN yarn build
# Start on excecution
CMD [ "yarn", "start:server" ]

FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]