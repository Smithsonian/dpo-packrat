FROM node:12

# Copy package.json for caching
ADD package*.json ./

# Add a work directory
WORKDIR /app

# Copy app files
COPY . /app

# Install dependencies
RUN yarn

# Expose port(s)
EXPOSE 3000 4000

# Build
RUN yarn build

# Start on excecution
CMD yarn start