#!/bin/bash
#
# lib/smoke_test_solr.sh - dev-workstation preflight for ops_solr.sh
#
# Stubs curl on PATH and drives a scratch .env.dev so URL discovery is
# exercised end-to-end. Asserts:
#
#   - --help works
#   - env-derived Solr URL (PACKRAT_SOLR_HOST + _PORT composed)
#   - env-derived server URL (REACT_APP_PACKRAT_SERVER_ENDPOINT)
#   - status hits each core's ping + select?q=*:*&rows=0
#   - clear requires typed 'yes' (non-interactive fails without --yes)
#   - clear --yes posts delete + commit to BOTH cores
#   - reindex staging --yes hits $SERVER/server/solrindex
#   - reindex fails cleanly when REACT_APP_PACKRAT_SERVER_ENDPOINT unset
#   - unknown op rejected
#   - audit log populated
#
# Exit 0 = all pass.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_solr.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }
banner_line() { echo ""; echo "--- $* ---"; }

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

STAGING_ROOT="$TMP_ROOT/staging"
PROD_ROOT="$TMP_ROOT/prod"
AUDIT="$TMP_ROOT/audit.log"
LOCKS="$TMP_ROOT/locks"
BIN="$TMP_ROOT/bin"
CURL_LOG="$TMP_ROOT/curl.log"

mkdir -p "$STAGING_ROOT/server/db/sql/scripts"
mkdir -p "$PROD_ROOT/server/db/sql/scripts"
mkdir -p "$LOCKS" "$BIN"

cat > "$STAGING_ROOT/.env.dev" <<'ENV'
PACKRAT_DATABASE_URL=mysql://packrat:pw%40test@db.local:3306/Packrat
PACKRAT_SOLR_HOST=solr-staging.local
PACKRAT_SOLR_PORT=8984
REACT_APP_PACKRAT_SERVER_ENDPOINT=https://packrat-staging.si.edu:8443
ENV

# Prod: deliberately omit the server endpoint to test the "unset" branch
cat > "$PROD_ROOT/.env.prod" <<'ENV'
PACKRAT_DATABASE_URL=mysql://packrat:pw%40test@db.local:3306/PackratProduction
PACKRAT_SOLR_HOST=solr-prod.local
PACKRAT_SOLR_PORT=8983
ENV

# ---------------------------------------------------------------------------
# curl stub
# ---------------------------------------------------------------------------
cat > "$BIN/curl" <<EOF
#!/bin/bash
LOG="$CURL_LOG"
# Record every call on its own line
{
    printf 'curl'
    for a in "\$@"; do printf ' %q' "\$a"; done
    echo
} >> "\$LOG"

url=""
for a in "\$@"; do
    case "\$a" in
        http://*|https://*) url="\$a" ;;
    esac
done

# Canned responses for the status op. The script appends "__HTTP__200"
# to the ping body via -w; our stub emits the JSON body AND respects
# the -w format if present.
wformat=""
prev=""
for a in "\$@"; do
    if [[ "\$prev" == "-w" ]]; then wformat="\$a"; fi
    prev="\$a"
done

case "\$url" in
    *admin/ping*)
        body='{"status":"OK","responseHeader":{"status":0}}'
        if [[ -n "\$wformat" ]]; then
            # Emit body then the -w-rendered trailing token(s).
            printf '%s' "\$body"
            printf '%s' "\${wformat//%\\{http_code\\}/200}" | sed 's/%{http_code}/200/g'
            echo
        else
            echo "\$body"
        fi
        ;;
    *select*)
        echo '{"response":{"numFound":42,"docs":[]}}'
        ;;
    *)
        # generic 200 response
        echo "OK"
        ;;
esac
exit 0
EOF
chmod +x "$BIN/curl"

# jq is often installed in dev shells; if not we still want the test to
# pass. We do NOT stub jq - we just assert on counts when present.

RUN_ENV_STAGING=(
    PATH="$BIN:$PATH"
    STAGING_CODE_ROOT="$STAGING_ROOT"
    STAGING_ENV_FILE="$STAGING_ROOT/.env.dev"
    STAGING_SQL_PATH="$STAGING_ROOT/server/db/sql/scripts"
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)
RUN_ENV_PROD=(
    PATH="$BIN:$PATH"
    PROD_CODE_ROOT="$PROD_ROOT"
    PROD_ENV_FILE="$PROD_ROOT/.env.prod"
    PROD_SQL_PATH="$PROD_ROOT/server/db/sql/scripts"
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)

run_s_staging() { env "${RUN_ENV_STAGING[@]}" bash "$SCRIPT" "$@"; }
run_s_prod()    { env "${RUN_ENV_PROD[@]}"    bash "$SCRIPT" "$@"; }

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

banner_line "--help prints usage"
out=$(run_s_staging --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "help missing 'Usage:'"
pass "--help works"

banner_line "unknown op rejected"
set +e
run_s_staging staging bogus </dev/null >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "unknown op should exit non-zero"
pass "unknown op rejected"

banner_line "staging status uses env-derived Solr URL"
: > "$CURL_LOG"
out=$(run_s_staging staging status 2>&1)
echo "$out" | grep -q "solr-staging.local:8984" || fail "Solr URL not derived from env"
grep -q "solr-staging.local:8984/solr/packrat/admin/ping" "$CURL_LOG" \
    || fail "ping not hit for primary core"
grep -q "solr-staging.local:8984/solr/packratMeta/admin/ping" "$CURL_LOG" \
    || fail "ping not hit for meta core"
grep -q "solr-staging.local:8984/solr/packrat/select" "$CURL_LOG" \
    || fail "count not hit for primary core"
pass "status uses env-derived URL and hits both cores"

banner_line "clear non-interactive without --yes refused"
set +e
run_s_staging staging clear </dev/null >/dev/null 2>&1
rc=$?
set -e
# confirm_danger reads from stdin; piping /dev/null yields empty and it
# rejects. Script returns 1.
(( rc != 0 )) || fail "clear without --yes in non-TTY should fail"
pass "clear refuses without --yes"

banner_line "clear --yes posts delete + commit to both cores"
: > "$CURL_LOG"
run_s_staging staging clear --yes >/dev/null 2>&1 || fail "clear --yes failed"
grep -q "solr/packrat/update" "$CURL_LOG"     || fail "primary update not posted"
grep -q "solr/packratMeta/update" "$CURL_LOG" || fail "meta update not posted"
# Expect 4 updates total: delete+commit x 2 cores
up_count=$(grep -c "solr.*update" "$CURL_LOG")
(( up_count == 4 )) || fail "expected 4 update calls, got $up_count"
pass "clear --yes hits both cores twice each"

banner_line "reindex staging --yes hits server endpoint"
: > "$CURL_LOG"
run_s_staging staging reindex --yes >/dev/null 2>&1 || fail "reindex failed"
grep -q "packrat-staging.si.edu:8443/server/solrindex" "$CURL_LOG" \
    || fail "reindex did not call expected server URL (log: $(cat "$CURL_LOG"))"
pass "reindex uses env-derived server endpoint"

banner_line "reindex prod with missing endpoint errors cleanly"
: > "$CURL_LOG"
set +e
out=$(run_s_prod prod reindex --yes 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "reindex should fail when endpoint is unset"
echo "$out" | grep -q "REACT_APP_PACKRAT_SERVER_ENDPOINT not set" \
    || fail "missing clear error for unset endpoint"
# Make sure we didn't hit any URL
grep -q "/server/solrindex" "$CURL_LOG" \
    && fail "should not have called server when endpoint missing"
pass "reindex fails cleanly when endpoint missing"

banner_line "audit log populated"
[[ -s "$AUDIT" ]] || fail "audit empty"
n=$(wc -l < "$AUDIT")
(( n > 4 )) || fail "too few audit lines ($n)"
grep -q "ops_solr.sh" "$AUDIT" || fail "audit missing script name"
pass "audit log populated ($n lines)"

echo ""
echo "all ops_solr.sh checks passed"
