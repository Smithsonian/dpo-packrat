#!/bin/bash
#
# ops_solr.sh - Packrat Solr operations (clear, reindex, status)
#
# Replaces: ops_solr.sh (old)
#
# Usage:
#   ./ops_solr.sh                                   # fully interactive
#   ./ops_solr.sh <env> <op>                        # non-interactive
#
# env tokens : 1 | 2 | prod | production | staging | stage | dev
#
# Subcommands:
#   status   - ping each core and print doc counts
#   clear    - DELETE *:* from both packrat + packratMeta cores (confirm)
#   reindex  - hit the Packrat server's /server/solrindex endpoint
#
# URL discovery (no hardcoded hosts):
#   Solr host   : $PACKRAT_SOLR_HOST from .env.* (fallback: $SOLR_HOST,
#                 then localhost:$PACKRAT_SOLR_PORT or localhost:8983)
#   Server URL  : $REACT_APP_PACKRAT_SERVER_ENDPOINT from .env.*
#
# Safety:
#   - clear requires typed 'yes' via confirm_danger, on prod AND staging.
#   - reindex on prod requires a standard y/N confirm to avoid an
#     accidental full reindex (can take hours).
#   - All subops are read-mostly except clear; no with_lock needed.
#
# Dependencies (checked per-op):
#   clear/reindex/status: curl
#   status: jq (for parsing ping + count JSON)
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_solr.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"
# shellcheck source=lib/credentials.sh
source "$HERE/lib/credentials.sh"

init_traps

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SOLR_CORE_PRIMARY="${SOLR_CORE_PRIMARY:-packrat}"
SOLR_CORE_META="${SOLR_CORE_META:-packratMeta}"
DEFAULT_SOLR_HOST="${DEFAULT_SOLR_HOST:-localhost:8983}"

# Populated by resolve_urls()
SOLR_BASE_URL=""
SERVER_BASE_URL=""

# ---------------------------------------------------------------------------
# URL discovery
# ---------------------------------------------------------------------------

resolve_urls() {
    # Solr host: explicit override first, then .env.*, then default.
    local host port
    host="${SOLR_HOST:-}"
    if [[ -z "$host" ]]; then
        host=$(read_env_var PACKRAT_SOLR_HOST 2>/dev/null || true)
    fi
    port=$(read_env_var PACKRAT_SOLR_PORT 2>/dev/null || true)

    if [[ -n "$host" && "$host" != *:* && -n "$port" ]]; then
        host="$host:$port"
    fi
    [[ -z "$host" ]] && host="$DEFAULT_SOLR_HOST"
    # Force http - Solr's admin API isn't typically TLS-wrapped on this box.
    SOLR_BASE_URL="http://$host/solr"

    # Packrat server URL
    local server
    server=$(read_env_var REACT_APP_PACKRAT_SERVER_ENDPOINT 2>/dev/null || true)
    if [[ -z "$server" ]]; then
        warn "REACT_APP_PACKRAT_SERVER_ENDPOINT not found in $ENV_FILE_USED"
        warn "reindex will fail without it; clear/status still work"
    fi
    # Strip trailing slash for clean concatenation
    SERVER_BASE_URL="${server%/}"
}

# ---------------------------------------------------------------------------
# Operation: status
# ---------------------------------------------------------------------------

op_status() {
    OPS_CURRENT_OP="status"
    require_cmd curl || return 127

    banner "SOLR STATUS ($ENV_LABEL)"
    echo "Solr  : $SOLR_BASE_URL"
    echo "Server: ${SERVER_BASE_URL:-<unset>}"
    echo ""

    local core ping_rc ping_body count_body num
    local use_jq=1
    command -v jq >/dev/null 2>&1 || use_jq=0
    (( use_jq == 0 )) && warn "jq not installed - printing raw responses"

    for core in "$SOLR_CORE_PRIMARY" "$SOLR_CORE_META"; do
        echo "--- core: $core ---"
        ping_body=$(curl -sS -o - -w '\n__HTTP__%{http_code}' \
            "$SOLR_BASE_URL/$core/admin/ping?wt=json" 2>&1) || ping_rc=$?
        local http_code="${ping_body##*__HTTP__}"
        ping_body="${ping_body%__HTTP__*}"
        if [[ "$http_code" == "200" ]]; then
            if (( use_jq )); then
                printf 'ping   : %s\n' "$(printf '%s' "$ping_body" | jq -r '.status // "?"' 2>/dev/null || echo '?')"
            else
                printf 'ping   : %s\n' "$ping_body"
            fi
        else
            printf 'ping   : FAIL (http %s)\n' "$http_code"
        fi

        count_body=$(curl -sS "$SOLR_BASE_URL/$core/select?q=*:*&rows=0&wt=json" 2>/dev/null || true)
        if (( use_jq )) && [[ -n "$count_body" ]]; then
            num=$(printf '%s' "$count_body" | jq -r '.response.numFound // "?"' 2>/dev/null || echo '?')
        else
            num="?"
        fi
        printf 'docs   : %s\n' "$num"
        echo ""
    done
}

# ---------------------------------------------------------------------------
# Operation: clear
# ---------------------------------------------------------------------------

op_clear() {
    OPS_CURRENT_OP="clear"
    local assume_yes=false
    while (( $# > 0 )); do
        case "$1" in
            --yes|-y) assume_yes=true ;;
            -h|--help)
                echo "usage: ops_solr.sh <env> clear [--yes]"
                return 0
                ;;
            *) err "clear: unknown arg '$1'"; return 1 ;;
        esac
        shift
    done

    require_cmd curl || return 127

    banner "SOLR CLEAR ($ENV_LABEL)"
    echo "Solr     : $SOLR_BASE_URL"
    echo "Cores    : $SOLR_CORE_PRIMARY, $SOLR_CORE_META"
    echo ""
    echo "This deletes every document in BOTH cores."

    if ! $assume_yes; then
        if ! confirm_danger "Clear Solr on $ENV_LABEL?"; then
            echo "Cancelled."
            return 1
        fi
    fi

    local core
    for core in "$SOLR_CORE_PRIMARY" "$SOLR_CORE_META"; do
        echo "Clearing $core..."
        curl -sS -X POST \
            -H 'Content-type:text/xml; charset=utf-8' \
            --data '<delete><query>*:*</query></delete>' \
            "$SOLR_BASE_URL/$core/update" || { err "delete failed on $core"; return 1; }
        echo ""
        curl -sS -X POST \
            -H 'Content-type:text/xml; charset=utf-8' \
            --data '<commit/>' \
            "$SOLR_BASE_URL/$core/update" || { err "commit failed on $core"; return 1; }
        echo ""
    done
    echo "Cleared."
}

# ---------------------------------------------------------------------------
# Operation: reindex
# ---------------------------------------------------------------------------

op_reindex() {
    OPS_CURRENT_OP="reindex"
    local assume_yes=false
    while (( $# > 0 )); do
        case "$1" in
            --yes|-y) assume_yes=true ;;
            -h|--help)
                echo "usage: ops_solr.sh <env> reindex [--yes]"
                return 0
                ;;
            *) err "reindex: unknown arg '$1'"; return 1 ;;
        esac
        shift
    done

    require_cmd curl || return 127

    if [[ -z "$SERVER_BASE_URL" ]]; then
        err "REACT_APP_PACKRAT_SERVER_ENDPOINT not set in $ENV_FILE_USED"
        return 1
    fi

    banner "SOLR REINDEX ($ENV_LABEL)"
    echo "Endpoint : $SERVER_BASE_URL/server/solrindex"
    echo ""

    if [[ "$ENVIRONMENT" == "prod" && "$assume_yes" != "true" ]]; then
        if ! confirm "Trigger full reindex on production? (can take hours)"; then
            echo "Cancelled."
            return 1
        fi
    fi

    # Stream the response (NOT fire-and-forget). --no-buffer ensures the
    # operator sees progress lines if the server emits any.
    curl -sS --no-buffer "$SERVER_BASE_URL/server/solrindex"
    local rc=$?
    echo ""
    if (( rc != 0 )); then
        err "curl returned $rc"
        return $rc
    fi
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    banner "PACKRAT SOLR OPS"
    echo "Environment: $ENV_LABEL"
    echo "Solr       : $SOLR_BASE_URL"
    echo "Server     : ${SERVER_BASE_URL:-<unset>}"
    echo ""
    echo "[1] Status"
    echo "[2] Clear"
    echo "[3] Reindex"
    echo "[Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1) op_status ;;
        2) op_clear ;;
        3) op_reindex ;;
        [Qq]) exit 0 ;;
        *) err "invalid choice"; return 1 ;;
    esac
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() {
    sed -n '2,35p' "$0"
}

case "${1:-}" in
    -h|--help) print_help; exit 0 ;;
esac

case "${1:-}" in
    1|2|prod|production|PROD|PRODUCTION|Prod|Production|\
    staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
        normalize_env "$1" >/dev/null
        shift
        ;;
esac

OP="${1:-}"
[[ -n "$OP" ]] && shift

if [[ -z "${ENVIRONMENT:-}" ]]; then
    select_env_interactive
fi

# We need the env file to resolve URLs; load_credentials does that as a
# side effect (sets ENV_FILE_USED). DB creds get loaded too but are unused.
if ! load_credentials; then
    print_summary "FAIL"
    exit 1
fi
resolve_urls

status="OK"
rc=0

if [[ -z "$OP" ]]; then
    main_menu || rc=$?
else
    case "$OP" in
        status)  op_status  "$@" || rc=$? ;;
        clear)   op_clear   "$@" || rc=$? ;;
        reindex) op_reindex "$@" || rc=$? ;;
        *)       err "unknown op: $OP"; rc=1 ;;
    esac
fi

(( rc != 0 )) && status="FAIL"
print_summary "$status"
exit $rc
