FROM node:12-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package*.json .
# Copy app files
COPY . .

FROM base AS client-builder
# Remove server to prevent duplication
RUN rm -rf server
# Install dependencies (production mode) and build
RUN yarn install --frozen-lockfile && yarn build

# Client's production image
FROM node:12-alpine AS client
# Add a work directory
WORKDIR /app
# Copy from build
COPY --from=client-builder /app/client/build .
# Expose port(s)
EXPOSE 3000
# Install static file server
RUN npm i -g serve
# Start on excecution
CMD serve -s . -l 3000

# Server's production image
FROM base AS server
# Remove client to prevent duplication
RUN rm -rf client
# Expose port(s)
EXPOSE 4000
# Install dependencies (production mode) and build
RUN yarn install --frozen-lockfile && yarn build
# Start on excecution
CMD [ "yarn", "start:server:prod" ]

FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]