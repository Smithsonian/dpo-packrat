#!/usr/bin/env bash
#
# Run the server test suite against a disposable MariaDB container that is fully
# isolated from any native/shared database. The container is created fresh, seeded
# with an isolated Packrat_test schema, used for the run, and removed on exit
# (including on failure). The repository storage tree (var/Storage) is never
# touched: tests write only to the server/var/test sandbox, which is also removed.
#
# Prerequisites (run once): `yarn` at the repo root so node_modules exist, and a
# running Docker daemon reachable by the current user.
#
# Usage:
#   conf/scripts/test-sandbox.sh                     # full suite
#   conf/scripts/test-sandbox.sh --testPathPattern=cache   # extra args pass to jest
#
# Overridable via environment:
#   PACKRAT_ENV_FILE          path to env file holding MYSQL_ROOT_PASSWORD (default .env.dev)
#   MYSQL_ROOT_PASSWORD       root password for the throwaway DB (default: read from env file)
#   PACKRAT_TEST_DB_PORT      host loopback port for the DB (default 3310)
#   PACKRAT_TEST_DB_IMAGE     MariaDB image (default mariadb:10.5)
#   PACKRAT_TEST_DB_CONTAINER container name (default packrat-db-test)
#   PACKRAT_TEST_SERVER_PORT  port transportSmoke binds (default 14000)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
ENV_FILE="${PACKRAT_ENV_FILE:-$REPO_ROOT/.env.dev}"

DB_CONTAINER="${PACKRAT_TEST_DB_CONTAINER:-packrat-db-test}"
DB_PORT="${PACKRAT_TEST_DB_PORT:-3310}"
DB_IMAGE="${PACKRAT_TEST_DB_IMAGE:-mariadb:10.5}"
SERVER_PORT="${PACKRAT_TEST_SERVER_PORT:-14000}"

# Root password for the throwaway DB: prefer an exported value, else read it from
# the env file. The value is never echoed.
if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
    MYSQL_ROOT_PASSWORD="$(grep -E '^MYSQL_ROOT_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n')"
fi
export MYSQL_ROOT_PASSWORD

cleanup() {
    docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
    rm -rf "$SERVER_DIR/var/test" || true
}
trap cleanup EXIT

# Fresh disposable DB, published on loopback only so nothing on the network can
# reach it and it cannot collide with a native server on :3306.
docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$DB_CONTAINER" -p "127.0.0.1:$DB_PORT:3306" \
    -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
    -v "$SERVER_DIR/db/sql:/app:ro" "$DB_IMAGE" >/dev/null

echo "[test-sandbox] waiting for database..."
# Wait for an AUTHENTICATED query, not just a ping: mysqladmin ping reports "alive"
# against MariaDB's temporary init server before the root password is set, which
# would let seeding start too early and fail with access-denied.
tries=0
until docker exec -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"' >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
        echo "[test-sandbox] database did not accept an authenticated connection in time" >&2
        exit 1
    fi
    sleep 2
done

echo "[test-sandbox] seeding Packrat_test..."
# Pass the password via the environment (-e) and reference it quoted inside the
# container shell, so no value is re-parsed by the inner shell regardless of its
# characters.
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS Packrat_test; CREATE DATABASE Packrat_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"'
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" --database=Packrat_test --default-character-set=utf8mb4 < /app/scripts/Packrat.SCHEMA.sql'
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" --database=Packrat_test --default-character-set=utf8mb4 < /app/scripts/Packrat.PROC.sql'
docker exec -i -e MYSQL_ROOT_PASSWORD "$DB_CONTAINER" sh -c '{ echo "SET autocommit=0; SET unique_checks=0; SET foreign_key_checks=0;"; cat /app/scripts/Packrat.DATA.sql; echo "COMMIT;"; } | mysql -u root -p"$MYSQL_ROOT_PASSWORD" --database=Packrat_test --default-character-set=utf8mb4'

# Point the suite at the throwaway DB over loopback (which the test guardrail
# accepts). The password is percent-encoded so URL parsing is safe. The suffixed
# schema name and local host are what the guardrail requires before it will run.
ENC_PW="$(node -e 'process.stdout.write(encodeURIComponent(process.env.MYSQL_ROOT_PASSWORD||""))')"
export PACKRAT_DATABASE_URL="mysql://root:$ENC_PW@127.0.0.1:$DB_PORT/Packrat_test"
export PACKRAT_SERVER_PORT="$SERVER_PORT"
export PACKRAT_EDAN_AUTH_KEY="${PACKRAT_EDAN_AUTH_KEY:-testing1234}"

echo "[test-sandbox] running suite..."
cd "$SERVER_DIR"
NODE_OPTIONS="--max-old-space-size=8192" npx jest --runInBand --config tests/jest.config.js "$@"
