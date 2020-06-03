FROM node:12-alpine

# Copy package.json for caching
ADD package*.json ./

# Add a work directory
WORKDIR /app

# Copy app files
COPY . /app

# Remove server to prevent duplication
RUN rm -rf server

# Install dependencies
RUN yarn

# Expose port(s)
EXPOSE 3000

# Build
RUN yarn build

# Start on excecution
CMD [ "yarn", "start:client" ]