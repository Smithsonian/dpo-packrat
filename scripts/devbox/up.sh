# Devbox for Packrat

IMAGE=node:12.18.4
PACKRAT_WORKDIR=/app
# Run node docker image and map port 3000, 4000 for access to client and server
docker run --name packrat-devbox -p 3000:3000 -p 4000:4000 -v ${PWD}:${PACKRAT_WORKDIR} --env-file ./.env.dev -itd $IMAGE

echo "Done"