# This script helps with updating docker images with new .env's
# usage: ./scripts/reload.sh <environment> (environment: dev | prod)

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
  # check if the branch is develop
  echo "Environment: Dev"
elif [[ $1 == $PROD ]]
then
  # check if the branch is master
  echo "Environment: Prod"
else
  echo "First argument should be either dev or prod"
  exit 1
fi

# Export required tags and environment variables used for building the images
export IMAGE_TAG=$IMAGE_TAG
export ENV=$ENV

echo "Reloading docker images for env $1 with tag: $IMAGE_TAG"

# Build packrat-server and client dynamically for environment's requested
docker-compose --env-file .env.$1 -f docker-compose.deploy.yml up -d packrat-server-$1 packrat-client-$1
