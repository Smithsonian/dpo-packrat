FROM node:12-alpine AS base
# Add a work directory
WORKDIR /app
# Copy package.json for caching
ADD package*.json .
# Copy app files
COPY . .
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
# Generate prisma client
RUN cd server/ && yarn generate:prisma && cd ../..
# Build
RUN yarn build
# Start on excecution
CMD [ "yarn", "start:server" ]

FROM nginx:1.17.10 as proxy
EXPOSE 80
RUN rm /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]