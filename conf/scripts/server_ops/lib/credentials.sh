#!/bin/bash
#
# lib/credentials.sh - discover + parse Packrat DB credentials from .env.*
#
# Sourced by any ops script that needs database access.
# Depends on lib/common.sh (for err()).
#
# Public API:
#   parse_database_url <url>       - populates DB_HOST/PORT/USER/PASS/NAME
#   load_credentials               - reads $ENVIRONMENT, resolves env file,
#                                    extracts PACKRAT_DATABASE_URL, applies
#                                    per-environment overrides, enforces
#                                    DB-name guardrail, sets SQL_PATH +
#                                    CODE_ROOT + ENV_FILE_USED
#   mysql_exec "SQL"               - batch/no-header query via loaded creds
#   mysql_exec_file path.sql       - pipe a file into mysql
#   metrics_size_sql [table]       - information_schema.TABLES report SQL
#   metrics_bucket_case <col> N... - CASE/WHEN age-bucket fragment
#
# Credential resolution order (first hit wins):
#   1. $PACKRAT_DATABASE_URL already in the environment (typically loaded
#      from the sibling ops .env by lib/common.sh, but also honored if set
#      by the shell or a cron entry directly)
#   2. $PROD_ENV_FILE / $STAGING_ENV_FILE (the application's .env on the
#      server - falls back to this when the ops .env does not pin DB creds)
#   3. <repo-root>/.env.prod or <repo-root>/.env.dev (dev workstation)
#   4. Hard fail with the list of paths checked
#
# After the URL is parsed, per-environment overrides are applied:
#   ENVIRONMENT=prod    -> $PROD_DB_HOST / $PROD_DB_NAME (if set)
#   ENVIRONMENT=staging -> $STAGING_DB_HOST / $STAGING_DB_NAME (if set)
#
# Then a guardrail enforces the env-to-database mapping:
#   prod    -> DB_NAME must be PackratProduction
#   staging -> DB_NAME must be PackratStaging (or "Packrat")
# A mismatch returns 1 before any SQL is executed.
#

if [[ -n "${__PACKRAT_LIB_CREDENTIALS_SOURCED:-}" ]]; then
    return 0
fi
__PACKRAT_LIB_CREDENTIALS_SOURCED=1

# ---------------------------------------------------------------------------
# Layout constants - single place to edit if paths change
# ---------------------------------------------------------------------------

PROD_CODE_ROOT="${PROD_CODE_ROOT:-/data/Packrat/Code/dpo-packrat}"
STAGING_CODE_ROOT="${STAGING_CODE_ROOT:-/data/Packrat/Code-Dev/dpo-packrat}"
PROD_ENV_FILE="${PROD_ENV_FILE:-$PROD_CODE_ROOT/.env.prod}"
STAGING_ENV_FILE="${STAGING_ENV_FILE:-$STAGING_CODE_ROOT/.env.dev}"
PROD_SQL_PATH="${PROD_SQL_PATH:-$PROD_CODE_ROOT/server/db/sql/scripts}"
STAGING_SQL_PATH="${STAGING_SQL_PATH:-$STAGING_CODE_ROOT/server/db/sql/scripts}"

# ---------------------------------------------------------------------------
# Populated by load_credentials
# ---------------------------------------------------------------------------

DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-}"
DB_USER="${DB_USER:-}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-}"
SQL_PATH="${SQL_PATH:-}"
CODE_ROOT="${CODE_ROOT:-}"
ENV_FILE_USED="${ENV_FILE_USED:-}"

# ---------------------------------------------------------------------------
# URL percent-decoding
# ---------------------------------------------------------------------------
#
# PACKRAT_DATABASE_URL should encode special chars in the user/password
# segments (%40 for '@', %3A for ':', etc.). We decode them here so the
# credentials we pass to mysql match what the DB has on file.

__url_decode() {
    local raw="$1"
    # Replace '+' with space (standard form-encoding convention)
    raw="${raw//+/ }"
    # %XX -> \xXX then let printf %b turn hex escapes into bytes.
    printf '%b' "${raw//%/\\x}"
}

# Parse a mysql:// URL into the DB_* variables.
#   mysql://user:pass@host:port/db[?params]
parse_database_url() {
    local url="$1"
    local rest creds hostdb user_raw pass_raw

    rest="${url#mysql://}"

    # Split on the LAST '@' so a literal '@' in a (still-encoded) password
    # segment wouldn't have confused us anyway - well-formed URLs encode it.
    creds="${rest%@*}"
    hostdb="${rest##*@}"

    user_raw="${creds%%:*}"
    pass_raw="${creds#*:}"

    DB_USER="$(__url_decode "$user_raw")"
    DB_PASS="$(__url_decode "$pass_raw")"

    local hostport="${hostdb%%/*}"
    DB_NAME="${hostdb#*/}"
    # Strip query string if present (?param=value)
    DB_NAME="${DB_NAME%%\?*}"

    if [[ "$hostport" == *:* ]]; then
        DB_HOST="${hostport%%:*}"
        DB_PORT="${hostport#*:}"
    else
        DB_HOST="$hostport"
        DB_PORT="3306"
    fi
}

# ---------------------------------------------------------------------------
# Repo-root fallback resolver (for developer workstations)
# ---------------------------------------------------------------------------

__find_repo_root() {
    local dir
    dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if command -v git >/dev/null 2>&1; then
        local root
        if root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null); then
            printf '%s' "$root"
            return 0
        fi
    fi
    # Non-git fallback: walk up looking for .env.template
    while [[ "$dir" != "/" && "$dir" != "" ]]; do
        if [[ -d "$dir/.git" || -f "$dir/.env.template" ]]; then
            printf '%s' "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# ---------------------------------------------------------------------------
# load_credentials - resolve env file, extract URL, apply per-env overrides,
#                    enforce env-to-database guardrail
# ---------------------------------------------------------------------------

load_credentials() {
    if [[ -z "${ENVIRONMENT:-}" ]]; then
        err "load_credentials: ENVIRONMENT is unset (call normalize_env first)"
        return 1
    fi

    local server_path="" fallback_root="" fallback_path=""
    case "$ENVIRONMENT" in
        prod)
            server_path="$PROD_ENV_FILE"
            SQL_PATH="$PROD_SQL_PATH"
            CODE_ROOT="$PROD_CODE_ROOT"
            ;;
        staging)
            server_path="$STAGING_ENV_FILE"
            SQL_PATH="$STAGING_SQL_PATH"
            CODE_ROOT="$STAGING_CODE_ROOT"
            ;;
        *)
            err "load_credentials: unknown ENVIRONMENT '$ENVIRONMENT'"
            return 1
            ;;
    esac

    # Honor PACKRAT_DATABASE_URL already in the environment first - this is
    # how the sibling ops .env (loaded by common.sh) injects credentials
    # without ever touching the application's .env file.
    local url="${PACKRAT_DATABASE_URL:-}"
    local env_file=""

    if [[ -n "$url" ]]; then
        ENV_FILE_USED="${OPS_ENV_FILE_USED:-<environment>}"
    else
        if [[ -f "$server_path" ]]; then
            env_file="$server_path"
        else
            # Dev-workstation fallback: repo root's .env.prod / .env.dev
            if fallback_root="$(__find_repo_root)"; then
                if [[ "$ENVIRONMENT" == "prod" ]]; then
                    fallback_path="$fallback_root/.env.prod"
                else
                    fallback_path="$fallback_root/.env.dev"
                fi
                if [[ -f "$fallback_path" ]]; then
                    env_file="$fallback_path"
                    SQL_PATH="$fallback_root/server/db/sql/scripts"
                    CODE_ROOT="$fallback_root"
                fi
            fi
        fi

        if [[ -z "$env_file" ]]; then
            err "cannot locate .env file for environment '$ENVIRONMENT'"
            err "  tried: \$PACKRAT_DATABASE_URL (unset)"
            err "  tried: $server_path"
            [[ -n "$fallback_path" ]] && err "  tried: $fallback_path"
            err "  set PACKRAT_DATABASE_URL in the ops .env or provide one of the files above"
            return 1
        fi

        ENV_FILE_USED="$env_file"

        # Pull the URL without sourcing the file (avoid executing arbitrary shell).
        url=$(grep -E '^[[:space:]]*PACKRAT_DATABASE_URL=' "$env_file" | head -n 1 | cut -d= -f2-)
        if [[ -z "$url" ]]; then
            err "PACKRAT_DATABASE_URL not found in $env_file"
            return 1
        fi
    fi

    # Strip surrounding quotes if present
    url="${url%\"}"; url="${url#\"}"
    url="${url%\'}"; url="${url#\'}"
    # Trim trailing whitespace/CR (Windows line endings in dev checkouts)
    url="${url%$'\r'}"
    url="${url%"${url##*[![:space:]]}"}"

    parse_database_url "$url"

    # Apply explicit per-environment overrides. The operator declares the
    # target host and database in the ops .env; the script does not infer
    # them from URL string-matching. This prevents a misconfigured URL
    # from accidentally pointing a staging op at the production database
    # (and is also how we force loopback on the DB host so connections
    # match the 'packrat'@'localhost' grant instead of being rejected as
    # 'packrat'@'<fqdn>').
    case "$ENVIRONMENT" in
        prod)
            [[ -n "${PROD_DB_HOST:-}" ]] && DB_HOST="$PROD_DB_HOST"
            [[ -n "${PROD_DB_NAME:-}" ]] && DB_NAME="$PROD_DB_NAME"
            ;;
        staging)
            [[ -n "${STAGING_DB_HOST:-}" ]] && DB_HOST="$STAGING_DB_HOST"
            [[ -n "${STAGING_DB_NAME:-}" ]] && DB_NAME="$STAGING_DB_NAME"
            ;;
    esac

    # Guardrail: refuse to run when the resolved DB name does not match
    # the chosen environment. Catches a fat-fingered URL or a missing
    # override before any SQL executes. "Packrat" is allowed for staging
    # because that is what the dev .env file ships with by convention.
    case "$ENVIRONMENT" in
        prod)
            if [[ "$DB_NAME" != "PackratProduction" ]]; then
                err "ENVIRONMENT=prod but resolved DB_NAME='$DB_NAME' (expected PackratProduction)"
                err "  set PROD_DB_NAME in the ops .env, or fix PACKRAT_DATABASE_URL"
                return 1
            fi
            ;;
        staging)
            if [[ "$DB_NAME" != "PackratStaging" && "$DB_NAME" != "Packrat" ]]; then
                err "ENVIRONMENT=staging but resolved DB_NAME='$DB_NAME' (expected PackratStaging)"
                err "  set STAGING_DB_NAME in the ops .env, or fix PACKRAT_DATABASE_URL"
                return 1
            fi
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Generic env-file reader (no `source` - avoids arbitrary-shell execution)
# ---------------------------------------------------------------------------
#
# read_env_var NAME [env_file]
#
# Extracts NAME=value from env_file (defaults to $ENV_FILE_USED after
# load_credentials). Strips surrounding quotes, trailing CR, trailing
# whitespace. Returns 1 if the key is absent or the file is missing.
# Prints the resolved value on stdout.

read_env_var() {
    local name="$1"
    local file="${2:-${ENV_FILE_USED:-}}"
    if [[ -z "$file" ]]; then
        err "read_env_var: no env file (ENV_FILE_USED unset and none passed)"
        return 1
    fi
    if [[ ! -f "$file" ]]; then
        err "read_env_var: missing env file: $file"
        return 1
    fi
    local raw
    raw=$(grep -E "^[[:space:]]*${name}=" "$file" | head -n 1 | cut -d= -f2-)
    if [[ -z "$raw" ]]; then
        return 1
    fi
    raw="${raw%\"}"; raw="${raw#\"}"
    raw="${raw%\'}"; raw="${raw#\'}"
    raw="${raw%$'\r'}"
    raw="${raw%"${raw##*[![:space:]]}"}"
    printf '%s' "$raw"
}

# ---------------------------------------------------------------------------
# MySQL exec helpers
# ---------------------------------------------------------------------------

mysql_exec() {
    mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --database="$DB_NAME" \
        --default-character-set=utf8mb4 \
        --batch --skip-column-names \
        -e "$1"
}

mysql_exec_file() {
    mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --database="$DB_NAME" \
        --default-character-set=utf8mb4 \
        < "$1"
}

# ---------------------------------------------------------------------------
# Metrics SQL builders
# ---------------------------------------------------------------------------
#
# Shared between `metrics size` and `metrics inspect`. Centralizing the
# column list and rounding means both subops report numbers the same way.

# metrics_size_sql [table]
#   - with a table name: single-row report for that table
#   - without:           whole-schema report sorted by total bytes desc
#
# Returns RAW byte counts. A bash-side formatter (format_metrics_size in
# ops_database.sh) auto-scales each cell to B/KB/MB/GB and aligns the
# columns. The previous formatter rounded to GB-with-3-decimals which
# made every Packrat staging table read as 0.000.
metrics_size_sql() {
    local table="${1:-}"
    local where=""
    local order="ORDER BY total_bytes DESC"
    if [[ -n "$table" ]]; then
        where="AND TABLE_NAME = '$table'"
        order=""
    fi
    cat <<SQL
SELECT
    TABLE_NAME                            AS table_name,
    TABLE_ROWS                            AS rows_est,
    DATA_LENGTH                           AS data_bytes,
    INDEX_LENGTH                          AS index_bytes,
    DATA_FREE                             AS free_bytes,
    (DATA_LENGTH + INDEX_LENGTH)          AS total_bytes
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '$DB_NAME'
  $where
$order;
SQL
}

# metrics_bucket_case <col> <boundary1> [boundary2 ...]
#
# Emits a SQL CASE expression that bins rows by age. Boundaries are day
# counts, ascending. For boundaries (7, 30, 60, 90, 180):
#   bucket '0-7d'    : col >= NOW() - 7d
#   bucket '7-30d'   : col >= NOW() - 30d (else)
#   bucket '30-60d'  : col >= NOW() - 60d (else)
#   ...
#   bucket 'over-180d' : else
#
# Use alongside a GROUP BY on the emitted expression.
metrics_bucket_case() {
    local col="$1"; shift
    local boundaries=("$@")
    local n=${#boundaries[@]}
    if (( n == 0 )); then
        err "metrics_bucket_case: need at least one boundary"
        return 1
    fi

    local out="CASE"
    local b prev
    b="${boundaries[0]}"
    out+=" WHEN \`$col\` >= DATE_SUB(NOW(), INTERVAL $b DAY) THEN '0-${b}d'"
    prev="$b"

    local i
    for (( i=1; i<n; i++ )); do
        b="${boundaries[$i]}"
        out+=" WHEN \`$col\` >= DATE_SUB(NOW(), INTERVAL $b DAY) THEN '${prev}-${b}d'"
        prev="$b"
    done

    out+=" ELSE 'over-${prev}d' END"
    printf '%s' "$out"
}
