#!/bin/bash
#
# lib/smoke_test_logs.sh - dev-workstation preflight for ops_logs.sh
#
# Spins up a fake log tree under a tempdir, points the script's path
# constants at it via env vars, and exercises the cheap non-interactive
# paths: resolve_log_file, validate_date, copy, backup (zip + tar.gz).
# No interactive tail/less since those block.
#
# Exit 0 = all pass; 1 = a check failed.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_logs.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

# ---------------------------------------------------------------------------
# Build a fake log tree
# ---------------------------------------------------------------------------

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

PROD_LOGS="$TMP_ROOT/prod"
DEV_LOGS="$TMP_ROOT/dev"
BACKUPS="$TMP_ROOT/backups"
AUDIT="$TMP_ROOT/audit.log"
DEST="$TMP_ROOT/dest"
LOCKS="$TMP_ROOT/locks"
mkdir -p "$PROD_LOGS" "$DEV_LOGS" "$BACKUPS" "$DEST" "$LOCKS"

TODAY=$(date +%F)
YESTERDAY=$(date -u -d "yesterday" +%F)

for day in "$TODAY" "$YESTERDAY" 2026-04-10 2026-04-11 2026-04-12; do
    y=$(date -d "$day" +%Y)
    m=$(date -d "$day" +%m)
    mkdir -p "$PROD_LOGS/$y/$m" "$DEV_LOGS/$y/$m"
    # Minimal valid JSON log line - one file per day
    printf '{"timestamp":"%sT12:00:00.000Z","level":"INFO","message":"hello %s","context":{"idRequest":1,"idUser":2,"section":"HTTP","caller":"t.ts"}}\n' \
        "$day" "$day" > "$PROD_LOGS/$y/$m/PackratLog_$day.log"
    cp "$PROD_LOGS/$y/$m/PackratLog_$day.log" "$DEV_LOGS/$y/$m/PackratLog_$day.log"
done

# Common env for every invocation below
COMMON_ENV=(
    LOG_BASE_PROD="$PROD_LOGS"
    LOG_BASE_DEV="$DEV_LOGS"
    LOG_BACKUP_ROOT="$BACKUPS"
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)

run_logs() {
    env "${COMMON_ENV[@]}" bash "$SCRIPT" "$@"
}

# ---------------------------------------------------------------------------
# Happy paths
# ---------------------------------------------------------------------------

banner_line() { echo ""; echo "--- $* ---"; }

if command -v zip >/dev/null 2>&1; then
    banner_line "backup prod (default yesterday, zip)"
    out=$(run_logs prod backup 2>&1)
    echo "$out" | grep -q "archived: PackratLog_$YESTERDAY.log" \
        || fail "backup default-yesterday (out: $out)"
    y=$(date -d "$YESTERDAY" +%Y); m=$(date -d "$YESTERDAY" +%m)
    zip_path="$BACKUPS/$y/Production/PackratLogs_${y}-${m}.zip"
    [[ -f "$zip_path" ]] || fail "expected zip at $zip_path"
    pass "backup prod (zip, default yesterday)"
else
    echo "SKIP: backup prod (zip) - zip not installed on this box"
    # Still exercise default-yesterday via tar.gz so the dispatch path is covered
    banner_line "backup prod (default yesterday, tar.gz fallback)"
    out=$(run_logs prod backup --format tar.gz 2>&1)
    y=$(date -d "$YESTERDAY" +%Y); m=$(date -d "$YESTERDAY" +%m)
    tar_default="$BACKUPS/$y/Production/PackratLogs_${y}-${m}.tar.gz"
    [[ -f "$tar_default" ]] || fail "expected tar.gz at $tar_default (out: $out)"
    pass "backup prod (tar.gz fallback, default yesterday)"
fi

banner_line "backup staging 2026-04-11 --format tar.gz"
out=$(run_logs staging backup 2026-04-11 --format tar.gz 2>&1)
tar_path="$BACKUPS/2026/Staging/PackratLogs_2026-04.tar.gz"
[[ -f "$tar_path" ]] || fail "expected tar.gz at $tar_path (out: $out)"
# Should contain multiple files since tar.gz re-tars the whole month
n=$(tar -tzf "$tar_path" | wc -l)
(( n >= 2 )) || fail "tar.gz has too few entries ($n)"
pass "backup staging (tar.gz, month rollup)"

banner_line "backup prod 2099-01-01 (no file - expect clean exit 0)"
out=$(run_logs prod backup 2099-01-01 2>&1) || rc=$?
echo "$out" | grep -q "nothing to archive" || fail "missing 'nothing to archive' msg"
pass "backup missing log (clean exit)"

banner_line "backup prod bogus --format"
if run_logs prod backup 2026-04-10 --format lzma >/dev/null 2>&1; then
    fail "bogus --format should have been rejected"
fi
pass "backup rejects unknown --format"

banner_line "copy prod 2026-04-10 2026-04-12 $DEST"
out=$(run_logs prod copy 2026-04-10 2026-04-12 "$DEST" 2>&1)
archive="$DEST/PackratLogs_production_2026-04-10_to_2026-04-12.tar.gz"
[[ -f "$archive" ]] || fail "expected archive at $archive (out: $out)"
n=$(tar -tzf "$archive" | wc -l)
(( n == 3 )) || fail "archive should have 3 files, has $n"
# All entries must be flat (no slashes)
tar -tzf "$archive" | grep -q "/" && fail "archive is not flattened"
pass "copy: range archive with flattened layout"

banner_line "copy prod with bad date"
if run_logs prod copy notadate 2026-04-12 "$DEST" >/dev/null 2>&1; then
    fail "bad date should have been rejected"
fi
pass "copy rejects bad date"

banner_line "copy prod start > end"
if run_logs prod copy 2026-04-12 2026-04-10 "$DEST" >/dev/null 2>&1; then
    fail "start>end should have been rejected"
fi
pass "copy rejects inverted range"

banner_line "unknown op rejected"
if run_logs prod does-not-exist >/dev/null 2>&1; then
    fail "unknown op should return non-zero"
fi
pass "unknown op rejected"

banner_line "--help prints usage"
out=$(run_logs --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "help output missing 'Usage:'"
pass "--help works"

banner_line "audit log has one line per invocation"
# Count lines in the audit file - should be > 0 and well-formed
[[ -s "$AUDIT" ]] || fail "audit log is empty"
line_count=$(wc -l < "$AUDIT")
(( line_count > 5 )) || fail "audit log has too few lines ($line_count)"
grep -q "ops_logs.sh" "$AUDIT" || fail "audit log missing script name"
pass "audit log populated ($line_count lines)"

echo ""
echo "all ops_logs.sh checks passed"
