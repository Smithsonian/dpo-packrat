FROM node:14.17.1-alpine AS server
# Add a work directory, copy package.json for caching, copy app files
WORKDIR /app
ADD package.json .
COPY . .

# Remove client to prevent duplication
RUN rm -rf client

# Install perl, needed by exiftool, and git, needed to fetch npm-server-webdav
RUN apk update
RUN apk add perl
RUN apk add git
RUN apk add strace
RUN apk add net-tools

# Install dependencies and build development
RUN mkdir -p /app/node_modules/@dpo-packrat/ && ln -s /app/common /app/node_modules/@dpo-packrat/common
RUN yarn
RUN yarn build:dev

# Expose port, and provide start command on execution
EXPOSE 4000
EXPOSE 9229
CMD [ "yarn", "start:server" ]
