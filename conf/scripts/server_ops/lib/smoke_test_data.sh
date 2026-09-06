#!/bin/bash
#
# lib/smoke_test_data.sh - dev-workstation preflight for ops_data.sh
#
# Builds a scratch "staging" and "backup" tree, points the script's path
# constants at them, and exercises the non-interactive paths:
#
#   - --help works
#   - unknown op rejected
#   - clear staging --dry-run lists but does NOT delete
#   - clear staging without --yes in non-TTY is refused
#   - clear staging --yes removes every entry under the target
#   - clear on an empty target reports "nothing to clear" (no prompt)
#   - backup staging rsyncs from src to dest (rsync stub captures args)
#   - backup second invocation while the first holds the lock exits 75
#   - audit log populated
#
# Exit 0 = all pass.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_data.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }
banner_line() { echo ""; echo "--- $* ---"; }

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

PROD_STAGING="$TMP_ROOT/prod_staging"
STAGING_STAGING="$TMP_ROOT/staging_staging"
PROD_REPO_SRC="$TMP_ROOT/prod_repo_src/"
STAGING_REPO_SRC="$TMP_ROOT/staging_repo_src/"
PROD_BACKUP_DST="$TMP_ROOT/prod_backup/"
STAGING_BACKUP_DST="$TMP_ROOT/staging_backup/"
BIN="$TMP_ROOT/bin"
AUDIT="$TMP_ROOT/audit.log"
LOCKS="$TMP_ROOT/locks"
RSYNC_LOG="$TMP_ROOT/rsync.log"

mkdir -p "$PROD_STAGING" "$STAGING_STAGING" \
         "$PROD_REPO_SRC" "$STAGING_REPO_SRC" \
         "$PROD_BACKUP_DST" "$STAGING_BACKUP_DST" \
         "$BIN" "$LOCKS"

# Seed a few entries in the staging dirs so "clear" has work to do.
seed_dir() {
    local d="$1" n
    for n in alpha beta gamma; do
        mkdir -p "$d/$n"
        echo "contents of $n" > "$d/$n/file.txt"
    done
    echo "loose file" > "$d/loose.bin"
}
seed_dir "$STAGING_STAGING"
# seed the repo sources too so backup rsync has something to "sync"
echo "repo A" > "$STAGING_REPO_SRC/a.bin"
echo "repo B" > "$STAGING_REPO_SRC/b.bin"

# ---------------------------------------------------------------------------
# rsync stub
# ---------------------------------------------------------------------------
cat > "$BIN/rsync" <<EOF
#!/bin/bash
LOG="$RSYNC_LOG"
{ printf 'rsync'; for a in "\$@"; do printf ' %q' "\$a"; done; echo; } >> "\$LOG"
# Optionally sleep to let us test the lock-collision path.
if [[ -n "\${RSYNC_STUB_SLEEP:-}" ]]; then
    sleep "\${RSYNC_STUB_SLEEP}"
fi
exit 0
EOF
chmod +x "$BIN/rsync"

RUN_ENV=(
    PATH="$BIN:$PATH"
    PROD_STAGING="$PROD_STAGING"
    STAGING_STAGING="$STAGING_STAGING"
    PROD_REPO_SRC="$PROD_REPO_SRC"
    STAGING_REPO_SRC="$STAGING_REPO_SRC"
    PROD_BACKUP_DST="$PROD_BACKUP_DST"
    STAGING_BACKUP_DST="$STAGING_BACKUP_DST"
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)

run_d() { env "${RUN_ENV[@]}" bash "$SCRIPT" "$@"; }

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

banner_line "--help prints usage"
out=$(run_d --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "help missing 'Usage:'"
pass "--help works"

banner_line "unknown op rejected"
set +e
run_d staging bogus </dev/null >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "unknown op should exit non-zero"
pass "unknown op rejected"

banner_line "clear --dry-run lists without deleting"
before=$(find "$STAGING_STAGING" -mindepth 1 -maxdepth 1 | wc -l)
out=$(run_d staging clear --dry-run 2>&1)
echo "$out" | grep -q "DRY RUN" || fail "missing 'DRY RUN' marker"
echo "$out" | grep -qi "Sample" || fail "expected sample listing"
after=$(find "$STAGING_STAGING" -mindepth 1 -maxdepth 1 | wc -l)
(( before == after )) || fail "dry-run deleted entries (before=$before after=$after)"
pass "clear --dry-run is non-destructive"

banner_line "clear without --yes in non-TTY refused"
set +e
out=$(run_d staging clear </dev/null 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "clear without --yes in non-TTY should exit non-zero"
# The dir should still be intact
remaining=$(find "$STAGING_STAGING" -mindepth 1 -maxdepth 1 | wc -l)
(( remaining == before )) || fail "clear deleted entries despite refusal"
pass "clear refuses without --yes"

banner_line "clear --yes removes all entries"
run_d staging clear --yes >/dev/null 2>&1 || fail "clear --yes failed"
after=$(find "$STAGING_STAGING" -mindepth 1 -maxdepth 1 | wc -l)
(( after == 0 )) || fail "expected 0 remaining, got $after"
# Target dir itself must still exist
[[ -d "$STAGING_STAGING" ]] || fail "clear removed the target dir itself"
pass "clear --yes wipes contents, keeps dir"

banner_line "clear on empty dir short-circuits"
out=$(run_d staging clear --yes 2>&1)
echo "$out" | grep -qi "nothing to clear" || fail "expected 'nothing to clear'"
pass "clear short-circuits when empty"

banner_line "backup staging rsyncs src -> dest"
: > "$RSYNC_LOG"
run_d staging backup >/dev/null 2>&1 || fail "backup failed"
grep -q "$STAGING_REPO_SRC" "$RSYNC_LOG" || fail "rsync missing src arg"
grep -q "$STAGING_BACKUP_DST" "$RSYNC_LOG" || fail "rsync missing dest arg"
pass "backup invokes rsync with env-derived paths"

banner_line "backup with custom dest"
: > "$RSYNC_LOG"
CUSTOM="$TMP_ROOT/custom_dest/"
run_d staging backup "$CUSTOM" >/dev/null 2>&1 || fail "custom-dest backup failed"
grep -q "$CUSTOM" "$RSYNC_LOG" || fail "custom dest not used"
pass "backup honors custom dest-dir"

banner_line "concurrent backup locks out second invocation"
if command -v flock >/dev/null 2>&1; then
    : > "$RSYNC_LOG"
    env "${RUN_ENV[@]}" RSYNC_STUB_SLEEP=3 \
        bash "$SCRIPT" staging backup "$TMP_ROOT/lock_dest/" >"$TMP_ROOT/bg.out" 2>&1 &
    bg_pid=$!
    # Wait for the first to acquire the lock
    for _ in $(seq 1 40); do
        if [[ -f "$LOCKS/data-backup-staging-"*".lock" ]]; then break; fi
        sleep 0.1
    done
    set +e
    out=$(run_d staging backup "$TMP_ROOT/lock_dest/" 2>&1)
    rc=$?
    set -e
    wait "$bg_pid" 2>/dev/null || true
    (( rc == 75 )) || fail "expected exit 75 (EX_TEMPFAIL), got $rc (out: $out)"
    echo "$out" | grep -q "already running" \
        || fail "missing 'already running' message"
    pass "second concurrent backup skipped (exit 75)"
else
    echo "SKIP: flock not installed - skipping concurrency check"
fi

banner_line "audit log populated"
[[ -s "$AUDIT" ]] || fail "audit empty"
n=$(wc -l < "$AUDIT")
(( n > 5 )) || fail "too few audit lines ($n)"
grep -q "ops_data.sh" "$AUDIT" || fail "audit missing script name"
pass "audit log populated ($n lines)"

echo ""
echo "all ops_data.sh checks passed"
