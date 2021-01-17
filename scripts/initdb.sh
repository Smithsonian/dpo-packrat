# This script helps with deployment of Packrat system's DB
# usage: ./initdb.sh <environment> (environment: dev | prod)

# Check if the variable MYSQL_ROOT_PASSWORD is set or not
if [[ -z "${MYSQL_ROOT_PASSWORD}" ]]
  then
    echo "Make sure env MYSQL_ROOT_PASSWORD is set"
    exit 1
fi

DEV="dev"
PROD="prod"
BRANCH=$(git branch --show-current)

# Environment given by the user
ENV=$1
# First 7 characters of the git SHA (basicaly short version of SHA)
IMAGE_TAG=$(git rev-parse --short=7 HEAD)

# Input validation
if [[ $1 == $DEV ]]
then
  echo "Environment: dev"
elif [[ $1 == $PROD ]]
then
  echo "Environment: prod"
else
  echo "First argument should be either dev or prod"
  exit 1
fi

# Export required tags and environment variables used for building the images
export IMAGE_TAG=$IMAGE_TAG
export ENV=$ENV

echo "Starting docker DB image for env $1 with tag: $IMAGE_TAG"

# Start the databases
docker-compose --env-file .env.$1 -f docker-compose.deploy.yml up -d packrat-db-$1

# DB init scripts
docker exec -i packrat-db-$1 sh -c "mysql -u root -p$MYSQL_ROOT_PASSWORD < /app/scripts/Packrat.SCHEMA.sql"
docker exec -i packrat-db-$1 sh -c "mysql -u root -p$MYSQL_ROOT_PASSWORD < /app/scripts/Packrat.PROC.sql"
docker exec -i packrat-db-$1 sh -c "mysql -u root -p$MYSQL_ROOT_PASSWORD < /app/scripts/Packrat.DATA.sql"
