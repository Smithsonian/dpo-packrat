FROM node:12-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package.json yarn.lock ./
# Copy app files
COPY . .
# Install dependencies (production mode) and build
RUN yarn install --frozen-lockfile && yarn build

# Client's production image
FROM node:12-alpine AS client
# Add a work directory
WORKDIR /app
# Copy from base builder
COPY --from=base /app/client/build .
# Expose port(s)
EXPOSE 3000
# Install static file server
RUN npm i -g serve
# Start on excecution
CMD serve -s . -l 3000

# Server's production image
FROM node:12-alpine AS server
# Add a work directory
WORKDIR /app
# Copy from base builder
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/server ./server
# Expose port(s)
EXPOSE 4000
# Start on excecution
CMD [ "node", "server/build/index.js" ]

FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]