FROM node:18.9.0-alpine AS client
# Add a work directory, copy package.json for caching, copy app files
WORKDIR /app
ADD package*.json .
COPY . .

# Remove server to prevent duplication
RUN rm -rf server

# Install dependencies and build
RUN mkdir -p /app/node_modules/@dpo-packrat/ && ln -s /app/common /app/node_modules/@dpo-packrat/common
RUN yarn
RUN yarn build:dev

# Expose port, and provide start command on execution
EXPOSE 3000
CMD [ "yarn", "start:client" ]