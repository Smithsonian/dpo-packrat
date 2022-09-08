# Devbox for Packrat

# Run node docker image and map port 3000, 4000 for access to client and server
docker run --name packrat-devbox -p 3000:3000 -p 4000:4000 -v ${PWD}:/app --env-file ./.env.dev -itd node:16.17.0-alpine

echo "Done"