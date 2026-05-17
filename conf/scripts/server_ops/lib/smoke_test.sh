#!/bin/bash
#
# lib/smoke_test.sh - sanity check for the shared library
#
# Sources all three lib files and exercises the cheapest public API under
# `set -euo pipefail` to catch unbound-variable bugs, missing quoting, and
# typos without requiring mysql, inotify, or any server-side infra.
#
# Usage:
#   ./lib/smoke_test.sh              # everything except load_credentials
#   ./lib/smoke_test.sh --creds      # also attempts load_credentials against
#                                    # a repo-root .env.dev fallback
#
# Exit codes:
#   0  all checks passed
#   1  a check failed (stderr describes what)
#
# Not intended for cron. This is a dev-workstation preflight.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=common.sh
source "$HERE/common.sh"
# shellcheck source=credentials.sh
source "$HERE/credentials.sh"
# shellcheck source=log_format.sh
source "$HERE/log_format.sh"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

pass() {
    echo "PASS: $*"
}

# ---------------------------------------------------------------------------
# common.sh
# ---------------------------------------------------------------------------

banner "smoke test"

# is_tty + colorize_level should not error regardless of tty state
colorize_level info >/dev/null || fail "colorize_level info"
colorize_level unknown_level >/dev/null || fail "colorize_level fallback"
pass "colorize_level"

# normalize_env happy paths
for input in 1 prod PRODUCTION Production; do
    normalize_env "$input" >/dev/null || fail "normalize_env $input"
    [[ "$ENVIRONMENT" == "prod" ]] || fail "normalize_env $input -> $ENVIRONMENT"
done
for input in 2 staging STAGE dev; do
    normalize_env "$input" >/dev/null || fail "normalize_env $input"
    [[ "$ENVIRONMENT" == "staging" ]] || fail "normalize_env $input -> $ENVIRONMENT"
done
pass "normalize_env: prod/staging variants"

# normalize_env rejects junk
if normalize_env "junk" 2>/dev/null; then
    fail "normalize_env accepted junk"
fi
pass "normalize_env: rejects unknown"

# require_cmd: something that certainly exists
require_cmd bash >/dev/null || fail "require_cmd bash"
# require_cmd: something that certainly does not
if require_cmd this_command_does_not_exist_xyz 2>/dev/null; then
    fail "require_cmd should have failed on bogus command"
fi
pass "require_cmd"

# Tmp file registration + manual cleanup path
tmp_probe="$(mktemp)"
register_tmp_file "$tmp_probe"
[[ " ${TMP_FILES[*]} " == *" $tmp_probe "* ]] || fail "register_tmp_file did not append"
pass "register_tmp_file"
rm -f "$tmp_probe"
# Reset for the remaining tests
TMP_FILES=()

# ---------------------------------------------------------------------------
# credentials.sh
# ---------------------------------------------------------------------------

# parse_database_url — plain password
parse_database_url "mysql://packrat:hunter2@db.example:3306/Packrat"
[[ "$DB_USER" == "packrat" ]]    || fail "DB_USER"
[[ "$DB_PASS" == "hunter2" ]]    || fail "DB_PASS"
[[ "$DB_HOST" == "db.example" ]] || fail "DB_HOST"
[[ "$DB_PORT" == "3306" ]]       || fail "DB_PORT"
[[ "$DB_NAME" == "Packrat" ]]    || fail "DB_NAME"
pass "parse_database_url: plain"

# parse_database_url — percent-encoded @ in password (%40)
parse_database_url "mysql://packrat:pa%40ss@db.example:3306/Packrat"
[[ "$DB_PASS" == "pa@ss" ]] || fail "url-decode %40 -> got '$DB_PASS'"
pass "parse_database_url: percent decode"

# parse_database_url — no port defaults to 3306
parse_database_url "mysql://u:p@host/db"
[[ "$DB_PORT" == "3306" ]] || fail "default port -> got '$DB_PORT'"
pass "parse_database_url: default port"

# parse_database_url — query string stripped from DB name
parse_database_url "mysql://u:p@host:3306/MyDB?sslmode=disabled"
[[ "$DB_NAME" == "MyDB" ]] || fail "query string not stripped -> '$DB_NAME'"
pass "parse_database_url: strips query string"

# metrics_size_sql — both modes
DB_NAME="PackratStaging"
whole=$(metrics_size_sql)
one=$(metrics_size_sql Audit)
[[ "$whole" == *"ORDER BY total_gb DESC"* ]] || fail "metrics_size_sql (whole) missing ORDER BY"
[[ "$one"   == *"AND TABLE_NAME = 'Audit'"* ]] || fail "metrics_size_sql (one) missing filter"
[[ "$one"   != *"ORDER BY total_gb DESC"* ]]   || fail "metrics_size_sql (one) should not ORDER BY"
pass "metrics_size_sql"

# metrics_bucket_case — the 7,30,60,90,180 pattern from the plan
frag=$(metrics_bucket_case AuditDate 7 30 60 90 180)
[[ "$frag" == *"'0-7d'"*       ]] || fail "bucket_case: missing 0-7d"
[[ "$frag" == *"'7-30d'"*      ]] || fail "bucket_case: missing 7-30d"
[[ "$frag" == *"'90-180d'"*    ]] || fail "bucket_case: missing 90-180d"
[[ "$frag" == *"ELSE 'over-180d'"* ]] || fail "bucket_case: missing over-180d"
pass "metrics_bucket_case"

# ---------------------------------------------------------------------------
# log_format.sh
# ---------------------------------------------------------------------------

out=$(strip_ansi "$(printf '\033[36minfo\033[0m')")
[[ "$out" == "info" ]] || fail "strip_ansi -> '$out'"
pass "strip_ansi"

# process_line --raw emits the input verbatim
raw_out=$(process_line --raw 'not-json at all' 2>/dev/null)
[[ "$raw_out" == "not-json at all" ]] || fail "process_line --raw: got '$raw_out'"
pass "process_line --raw"

# process_line on a real JSON line (only checked if jq exists)
if command -v jq >/dev/null 2>&1; then
    sample='{"timestamp":"2026-04-16T10:00:00.000Z","level":"INFO","message":"hello","context":{"idRequest":42,"idUser":7,"section":"HTTP","caller":"x.ts"}}'
    pl_out=$(process_line "$sample" 2>/dev/null)
    [[ "$pl_out" == *"hello"*      ]] || fail "process_line: missing message"
    [[ "$pl_out" == *"00042"*      ]] || fail "process_line: missing padded requestId"
    [[ "$pl_out" == *"U0007"*      ]] || fail "process_line: missing padded userId"
    pass "process_line: real JSON"
else
    echo "SKIP: process_line real JSON (jq not installed)"
fi

# ---------------------------------------------------------------------------
# load_credentials (optional - needs a .env.dev under repo root)
# ---------------------------------------------------------------------------

if [[ "${1:-}" == "--creds" ]]; then
    normalize_env staging >/dev/null
    if load_credentials 2>/dev/null; then
        [[ -n "$DB_HOST" && -n "$DB_USER" && -n "$DB_NAME" ]] \
            || fail "load_credentials did not populate DB_*"
        pass "load_credentials (from $ENV_FILE_USED)"
    else
        echo "SKIP: load_credentials - no reachable .env file (expected on a bare dev box)"
    fi
fi

# ---------------------------------------------------------------------------
# print_summary — exercises the end-of-run code path
# ---------------------------------------------------------------------------

OPS_CURRENT_OP="smoke-test"
normalize_env staging >/dev/null

# Redirect audit log to a throwaway path so the test never touches /var/log
tmp_audit="$(mktemp)"
OPS_AUDIT_LOG="$tmp_audit" print_summary "OK"
[[ -s "$tmp_audit" ]] || fail "audit_log wrote no line"
grep -q "smoke-test" "$tmp_audit" || fail "audit_log missing op"
grep -q "staging"    "$tmp_audit" || fail "audit_log missing env"
grep -q "OK"         "$tmp_audit" || fail "audit_log missing status"
rm -f "$tmp_audit"
pass "print_summary + audit_log"

echo ""
echo "all checks passed"
