FROM node:18.9.0-alpine AS base
# Add a work directory, copy package.json for caching, copy app files
WORKDIR /app
ADD package.json yarn.lock ./
COPY . .

# Remove server from client build
RUN rm -rf server

# Install dependencies (production mode) and build
RUN mkdir -p /app/node_modules/@dpo-packrat/ && ln -s /app/common /app/node_modules/@dpo-packrat/common
RUN yarn install --frozen-lockfile
RUN yarn build:prod

# Client's production image; add a work directory and copy from base
FROM node:18.9.0-alpine AS client
WORKDIR /app
COPY --from=base /app/client/build .

# Expose port, install static file server, and provide start command on execution
EXPOSE 3000
RUN npm i -g serve
CMD serve -s . -l 3000
