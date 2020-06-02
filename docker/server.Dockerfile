FROM node:12-alpine

# Copy package.json for caching
ADD package*.json ./

# Add a work directory
WORKDIR /app

# Copy app files
COPY . /app

# Remove client to prevent duplication
RUN rm -rf client

# Install dependencies
RUN yarn

# Expose port(s)
EXPOSE 4000

# Build
RUN yarn build

# Start on excecution
CMD [ "yarn", "start:server" ]