# Opens a shell in the specified docker container
# Input validation
if [[ $1 != "server" &&
      $1 != "client" &&
      $1 != "solr" &&
      $1 != "db" ]]
then
  echo "Usage:   packsh.sh (server|client|solr|db) (dev|prod)"
  echo "Example: packsh.sh server dev"
  echo "         Opens a shell in the specified docker container"
  exit 1
fi

# Input validation
if [[ $2 == "prod" ]]
then
  ENV="prod"
elif [[ $2 == "inspect" ]]
then
  ENV="inspect"
else
  ENV="dev"
fi

CONTAINER=packrat-$1-$ENV

docker exec -u 0 -it $CONTAINER /bin/bash
