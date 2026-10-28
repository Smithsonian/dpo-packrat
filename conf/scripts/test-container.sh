#!/usr/bin/env bash
#
# Run the server test suite (or the parity lane) inside the pinned-Node
# production runtime — the node:18.9.0-alpine dev image — against a disposable
# MariaDB container. This is the accurate, reproducible harness: the same image
# that serves production runs the tests, so results do not depend on the host's
# Node/OpenSSL/libraries. The database and (when built here) the test image are
# removed on exit; the native database and repository storage are never touched.
#
# Modes:
#   suite         full regression suite (default; the in-runtime 'yarn test')
#   parity        parity lane in assert mode ('yarn test:parity')
#   parity-bless  parity lane in write mode ('yarn test:parity:bless'); the
#                 regenerated baselines are written back to the host checkout
#
# Usage:
#   conf/scripts/test-container.sh [suite|parity|parity-bless] [--rebuild] [-- <extra jest args>]
#
#   --rebuild  force a fresh image build (otherwise an existing
#              packrat-server-test:local is reused as-is)
#
# Environment overrides:
#   PACKRAT_ENV_FILE       env file holding MYSQL_ROOT_PASSWORD (default .env.dev)
#   MYSQL_ROOT_PASSWORD    throwaway DB root password (default: read from env file)
#   PACKRAT_TEST_IMAGE     image to run tests in; if unset, one is built from
#                          conf/docker/server-dev.Dockerfile tagged
#                          packrat-server-test:local. Set this to the deployed
#                          packrat-server-dev:<tag> to skip the build.
#   PACKRAT_TEST_DB_IMAGE  MariaDB image (default mariadb:10.5)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PACKRAT_ENV_FILE:-$REPO_ROOT/.env.dev}"
DB_IMAGE="${PACKRAT_TEST_DB_IMAGE:-mariadb:10.5}"
DB_CONTAINER="packrat-db-ctest"
TEST_IMAGE="${PACKRAT_TEST_IMAGE:-}"

MODE="${1:-suite}"
case "$MODE" in
    suite|parity|parity-bless) ;;
    *) echo "unknown mode: $MODE (use suite|parity|parity-bless)" >&2; exit 2 ;;
esac
shift || true

# Remaining args: consume --rebuild anywhere; everything else forwards to jest.
REBUILD=0
EXTRA_ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        --rebuild) REBUILD=1; shift ;;
        --) shift; while [ $# -gt 0 ]; do EXTRA_ARGS+=("$1"); shift; done ;;
        *) EXTRA_ARGS+=("$1"); shift ;;
    esac
done

if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
    MYSQL_ROOT_PASSWORD="$(grep -E '^MYSQL_ROOT_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n')"
fi
export MYSQL_ROOT_PASSWORD

cleanup() {
    docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Build a test image from the current checkout if none supplied.
if [ -z "$TEST_IMAGE" ]; then
    TEST_IMAGE="packrat-server-test:local"
    if [ "$REBUILD" = "1" ]; then
        docker image rm -f "$TEST_IMAGE" >/dev/null 2>&1 || true
    fi
    if docker image inspect "$TEST_IMAGE" >/dev/null 2>&1; then
        echo "[test-container] reusing existing $TEST_IMAGE (force a fresh build with: yarn test:container --rebuild)"
    else
        echo "[test-container] building $TEST_IMAGE from server-dev.Dockerfile..."
        docker build -f "$REPO_ROOT/conf/docker/server-dev.Dockerfile" -t "$TEST_IMAGE" "$REPO_ROOT"
    fi
fi

# Disposable DB with no published port: the test container shares this one's
# network namespace, so it reaches MariaDB at 127.0.0.1:3306 — which the test
# guardrail accepts — with no exposure on the host and no new docker network.
docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$DB_CONTAINER" \
    -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
    -v "$REPO_ROOT/server/db/sql:/app:ro" "$DB_IMAGE" >/dev/null

echo "[test-container] waiting for database..."
# Wait for an AUTHENTICATED query to succeed, not just a ping: mysqladmin ping
# reports "alive" against MariaDB's temporary init server before the root password
# is set, which would let seeding start too early and fail with access-denied.
tries=0
until docker exec -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"' >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
        echo "[test-container] database did not accept an authenticated connection in time" >&2
        exit 1
    fi
    sleep 2
done

echo "[test-container] seeding Packrat_test..."
# Pass the password via the environment (-e) and reference it quoted inside the
# container shell, so no value is re-parsed by the inner shell regardless of its
# characters.
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS Packrat_test; CREATE DATABASE Packrat_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"'
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" --database=Packrat_test --default-character-set=utf8mb4 < /app/scripts/Packrat.SCHEMA.sql'
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" --database=Packrat_test --default-character-set=utf8mb4 < /app/scripts/Packrat.PROC.sql'
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c '{ echo "SET autocommit=0; SET unique_checks=0; SET foreign_key_checks=0;"; cat /app/scripts/Packrat.DATA.sql; echo "COMMIT;"; } | mysql -u root -p"$MYSQL_ROOT_PASSWORD" --database=Packrat_test --default-character-set=utf8mb4'

# The pinned Node in the image accepts --openssl-legacy-provider, so the
# committed yarn scripts run unmodified.
case "$MODE" in
    suite)        YARN_SCRIPT="test" ;;
    parity)       YARN_SCRIPT="test:parity" ;;
    parity-bless) YARN_SCRIPT="test:parity:bless" ;;
esac

# Parity reads/writes its baselines in the checkout; bind-mount that one dir so a
# bless lands on the host and an assert uses the committed baselines.
MOUNTS=()
if [ "$MODE" != "suite" ]; then
    MOUNTS+=(-v "$REPO_ROOT/server/tests/parity/baselines:/app/server/tests/parity/baselines")
fi

echo "[test-container] running '$YARN_SCRIPT' in $TEST_IMAGE..."
# The DB URL is assembled inside the container (which always has Node), so the host
# needs only docker + a POSIX shell — not a local Node. The password is passed in and
# percent-encoded there; the loopback host is what the guardrail accepts.
docker run --rm --network "container:$DB_CONTAINER" \
    -w /app/server \
    -e MYSQL_ROOT_PASSWORD \
    -e PACKRAT_EDAN_AUTH_KEY="${PACKRAT_EDAN_AUTH_KEY:-testing1234}" \
    -e PACKRAT_SERVER_PORT="${PACKRAT_TEST_SERVER_PORT:-14000}" \
    "${MOUNTS[@]+"${MOUNTS[@]}"}" \
    "$TEST_IMAGE" \
    sh -lc 'export PACKRAT_DATABASE_URL="mysql://root:$(node -e "process.stdout.write(encodeURIComponent(process.env.MYSQL_ROOT_PASSWORD||String()))")@127.0.0.1:3306/Packrat_test"; exec yarn "$0" "$@"' "$YARN_SCRIPT" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
