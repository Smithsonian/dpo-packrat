#!/usr/bin/env bash

# -----------------------------------------------------------------------------
# Packrat Docker Cleanup Script
#
# This script cleans up Docker resources (containers, volumes, images) for
# specific environments (Production or Staging) to prepare for a new deployment.
#
# Arguments:
#   -e <env>    : Environment to clean.
#                 Accepted values: 'prod', 'production', 'dev', 'staging'.
#                 If omitted, an interactive menu is displayed.
#   -u <user>   : System username to use for the temporary directory path.
#                 If omitted, prompts for input (defaults to current user).
#   -c          : Clear Docker Build Cache (prune -a).
#                 If provided, forces cache clearing.
#                 If omitted, prompts for confirmation (defaults to 'No' in non-interactive).
#   -h          : Show help/usage information.
#
# Usage Examples:
#   ./cleanup.sh                        # Fully interactive mode
#   ./cleanup.sh -e prod                # Interactive for User/Cache only
#   ./cleanup.sh -e dev -u jenkins -c   # Fully automated (Clean Staging + Cache)
# -----------------------------------------------------------------------------
clear
set -Eeuo pipefail

# -----------------------------------
# Configuration & Defaults
# -----------------------------------
ARG_ENV=""
ARG_USER=""
ARG_CLEAN_CACHE=false

# -----------------------------------
# Helper: Logging
# -----------------------------------
log() { echo "==> $*"; }

error() { echo "Error: $*" >&2; exit 1; }

# -----------------------------------
# Helper: Safe xargs (GNU/BSD compatible)
# -----------------------------------
xargs_safe() {
  if [ -t 0 ]; then
      # If input is a TTY (no pipe), do nothing or handle arguments directly
      if [ $# -gt 0 ]; then
          "$@"
      fi
  else
      # We have piped input
      local input
      input="$(cat)"
      if [ -n "$input" ]; then
          echo "$input" | xargs "$@"
      fi
  fi
}

# -----------------------------------
# 1. Parse Command Line Arguments
# -----------------------------------
usage() {
  echo "Usage: $0 [-e <prod|dev>] [-u <username>] [-c] [-h]"
  echo "  -e  Environment (prod/staging/dev)"
  echo "  -u  User for temp files"
  echo "  -c  Clean build cache (optional)"
  echo "  -h  Show help"
  exit 1
}

while getopts "e:u:ch" opt; do
  case "$opt" in
    e) ARG_ENV=$OPTARG ;;
    u) ARG_USER=$OPTARG ;;
    c) ARG_CLEAN_CACHE=true ;;
    h) usage ;;
    *) usage ;;
  esac
done

# -----------------------------------
# 2. Interactive Prompts (if args missing)
# -----------------------------------
echo ""
echo "*****************************************************"
echo "PACKRAT: CLEANUP & PREPARATION"
echo "*****************************************************"

# Environment Selection
if [ -z "$ARG_ENV" ]; then
  echo "[1] Production"
  echo "[2] Staging"
  echo "[q] Quit"
  read -r -p "Select environment: " CHOICE
  case "$CHOICE" in
    1) ARG_ENV="prod" ;;
    2) ARG_ENV="dev" ;; # Mapping 2 to dev/staging based on your logic
    q|Q) exit 0 ;;
    *) error "Invalid choice" ;;
  esac
fi

# Map Input to Variables
case "$ARG_ENV" in
  prod|production|Production)
    SUFFIX="-prod"
    ENVIRONMENT="Production"
    ;;
  dev|staging|Staging)
    SUFFIX="-dev"
    ENVIRONMENT="Staging"
    ;;
  *)
    error "Unknown environment: $ARG_ENV"
    ;;
esac

# User Selection
if [ -z "$ARG_USER" ]; then
  read -r -p "Enter username for temp files (default: $USER): " INPUT_USER
  ARG_USER="${INPUT_USER:-$USER}"
fi

# Build Cache Selection (Skip prompt if flag -c was used)
if [ "$ARG_CLEAN_CACHE" = false ]; then
  # Check if we are interactive before prompting
  if [ -t 0 ]; then
    echo ""
    read -r -p "Clean Docker Build Cache? (Slows next build) [y/N]: " CACHE_CHOICE
    case "$CACHE_CHOICE" in
        [yY][eE][sS]|[yY]) ARG_CLEAN_CACHE=true ;;
        *) ARG_CLEAN_CACHE=false ;;
    esac
  fi
fi

echo ""
log "Configuration:"
echo "    Environment : $ENVIRONMENT (Suffix: $SUFFIX)"
echo "    Temp User   : $ARG_USER"
echo "    Clean Cache : $ARG_CLEAN_CACHE"
echo ""

# -----------------------------------
# 3. Identify Resources
# -----------------------------------

# Fix: Use grep for regex matching instead of --filter
# Matches: Starts with 'packrat-', ends with suffix (e.g., packrat-client-prod)
get_env_containers() {
  local list
  list=$(docker ps -a --format '{{.Names}}' | grep -E "^packrat-.*${SUFFIX}$")

  # SAFETY CHECK: 
  # If Production, ensure we do NOT touch Solr, even if regex matched it somehow.
  if [ "$ENVIRONMENT" == "Production" ]; then
    echo "$list" | grep -v "solr" || true
  else
    echo "$list"
  fi
}

# -----------------------------------
# 4. Capture Named Volumes (Before Deletion)
# -----------------------------------
# We inspect the specific containers identified above to find their Named Volumes.
CONTAINER_LIST="$(get_env_containers)"

if [ -z "$CONTAINER_LIST" ]; then
  log "No matching containers found. Skipping container removal."
  ENV_VOLUMES=""
else
  log "Identifying named volumes attached to target containers..."
  # inspect the list, look for Type=volume, print Name
  ENV_VOLUMES=$(echo "$CONTAINER_LIST" | xargs_safe docker inspect -f '{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}}{{"\n"}}{{end}}{{end}}' | sort -u)
fi

# -----------------------------------
# 5. Stop and Remove Containers
# -----------------------------------
if [ -n "$CONTAINER_LIST" ]; then
  log "Stopping containers:"
  echo "$CONTAINER_LIST" | sed 's/^/  - /'
  echo "$CONTAINER_LIST" | xargs_safe docker stop || true

  log "Removing containers (and anonymous volumes)..."
  # -v is CRITICAL: it removes anonymous volumes (hashes) attached to the container
  echo "$CONTAINER_LIST" | xargs_safe docker rm -f -v || true
fi

# -----------------------------------
# 6. Remove Named Volumes (If Unused)
# -----------------------------------
if [ -n "$ENV_VOLUMES" ]; then
  log "Checking captured named volumes..."
  while IFS= read -r v; do
    [ -z "$v" ] && continue
    # Check if ANY container (even from other envs) is using this volume
    if [ -z "$(docker ps -aq --filter "volume=$v")" ]; then
      log "Removing unused volume: $v"
      docker volume rm "$v" >/dev/null 2>&1 || true
    else
      log "Skipping volume (in use by other container): $v"
    fi
  done <<< "$ENV_VOLUMES"
else
  log "No named volumes to clean."
fi

# -----------------------------------
# 7. Remove Images
# -----------------------------------
# Strategy: Find images where the Repository name contains "packrat-" and the suffix.
# e.g., packrat-client-prod, packrat-server-prod.
log "Cleaning up images matching 'packrat-*${SUFFIX}'..."

# 1. List IDs of images matching the naming convention
IMAGES_TO_REMOVE=$(docker images --format '{{.Repository}} {{.ID}}' | grep -E "^packrat-.*${SUFFIX}" | awk '{print $2}' | sort -u)

# 2. Solr Staging Exception
if [ "$ENVIRONMENT" == "Staging" ]; then
  log "Staging: including Solr images..."
  SOLR_IMGS=$(docker images --format '{{.Repository}} {{.ID}}' | grep "packrat-solr" | awk '{print $2}')
  IMAGES_TO_REMOVE="$IMAGES_TO_REMOVE $SOLR_IMGS"
fi

if [ -n "$IMAGES_TO_REMOVE" ]; then
  # Replace newlines with spaces for xargs
  echo "$IMAGES_TO_REMOVE" | tr '\n' ' ' | xargs_safe docker rmi -f || true
else
  log "No specific environment images found to remove."
fi

# Always prune dangling images (untagged/intermediate)
log "Pruning dangling images..."
docker image prune -f || true

# -----------------------------------
# 8. Network Prune (Safe)
# -----------------------------------
log "Pruning unused networks..."
docker network prune -f || true

# -----------------------------------
# 9. Build Cache (Optional)
# -----------------------------------
if [ "$ARG_CLEAN_CACHE" = true ]; then
  log "Removing Docker Build Cache (All)..."
  docker builder prune -a -f || true
else
  log "Skipping build cache cleanup."
fi

# -----------------------------------
# 10. Operational Fix (tmp mount)
# -----------------------------------
log "Applying operational fix: Remounting /tmp with exec..."
export TMPDIR="/home/${ARG_USER}/tmp"

# Ensure target directory exists
if [ ! -d "$TMPDIR" ]; then
    log "Creating temp dir: $TMPDIR"
    mkdir -p "$TMPDIR"
    chown "$ARG_USER" "$TMPDIR" || true
fi

# Use sudo. If script is run as root, sudo is fine. If not, this might prompt.
sudo mount /tmp -o remount,exec
log "/tmp remounted."

log "Cleanup Complete."