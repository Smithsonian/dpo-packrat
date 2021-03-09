# Creates a docker network and connect devbox and db

docker network create packrat-devbox-network
docker network connect packrat-devbox-network packrat-devbox
docker network connect packrat-devbox-network packrat-devbox-db
docker network connect packrat-devbox-network packrat-devbox-solr

echo "Done"