# This script helps with deployment of Packrat system
# usage: ./conf/scripts/deploy.sh <environment> (environment: dev | prod | inspect)

DEV="dev"
PROD="prod"
INSPECT="inspect"
FRANKEN="franken"
BRANCH=$(git branch --show-current)

# Environment given by the user
ENV=$1
# First 7 characters of the git SHA (basicaly short version of SHA)
IMAGE_TAG=$(git rev-parse --short=7 HEAD)

# Checks if the current branch matches the desired branch
function branch_check() {
  CURRENT_BRANCH=$1
  DESIRED_BRANCH=$2
  ENV=$3

  if [ $CURRENT_BRANCH != $DESIRED_BRANCH ]
    then
      echo "Cannot deploy branch $CURRENT_BRANCH to $3 environment. Make sure you're on $DESIRED_BRANCH branch"
      exit 1
  fi
}

# Input validation
if [[ $1 == $DEV ]]
then
  # check if the branch is develop
  branch_check $BRANCH "develop" $1
elif [[ $1 == $PROD ]]
then
  # check if the branch is master
  branch_check $BRANCH "master" $1
elif [[ $1 == $INSPECT ]]
then
  # check if the branch is develop
  branch_check $BRANCH "develop" $1
elif [[ $1 == $FRANKEN ]]
then
  ENV="dev"
  echo "ALERT: Frankenbuild of dev environment"
else
  echo "First argument should be one of { dev, prod, inspect, franken }"
  exit 1
fi

# Export required tags and environment variables used for building the images
export IMAGE_TAG=$IMAGE_TAG
export ENV=$ENV

echo "Deploying docker images for env $ENV with tag: $IMAGE_TAG"

# Docker containers need IPv4 forwarding for build-time egress (apk/npm reach package mirrors) and for
# runtime networking. A hardened sysctl baseline (e.g. CIS/STIG) can pin net.ipv4.ip_forward=0, which
# severs container egress and fails the build at 'apk update'. Assert it here so a deploy never fails on
# it. The host should persist this as 1 (a container host requires it); this is a build-time safety net.
if [ "$(sysctl -n net.ipv4.ip_forward 2>/dev/null)" != "1" ]; then
  echo "WARN: net.ipv4.ip_forward=0 — enabling for Docker container egress (host should persist this as 1)"
  sudo sysctl -w net.ipv4.ip_forward=1 || echo "WARN: could not set net.ipv4.ip_forward (need passwordless sudo); build may fail to reach package mirrors"
fi

# Build packrat-server and client dynamically for environment's requested
docker compose --env-file .env.$ENV -f ./conf/docker/docker-compose.deploy.yml up --build -d packrat-server-$ENV packrat-client-$ENV packrat-solr-$ENV
