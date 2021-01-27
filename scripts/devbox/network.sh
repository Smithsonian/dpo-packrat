# Creates a docker network and connect devbox and db

NETWORK_NAME=packrat-devbox-network

docker network create $NETWORK_NAME
docker network connect $NETWORK_NAME packrat-devbox
docker network connect $NETWORK_NAME packrat-db

echo "Successful"