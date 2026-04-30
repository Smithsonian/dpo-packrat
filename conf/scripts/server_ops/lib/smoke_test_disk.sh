#!/bin/bash
#
# lib/smoke_test_disk.sh - dev-workstation preflight for ops_disk.sh
#
# Exercises usage (with --path to a real tempdir so df has something to
# show), cleanup --dry-run (no truncation, no confirmation), and a few
# error paths. Cannot cover watch / monitor since they block.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_disk.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

TMP_ROOT="$(mktemp -d)"
AUDIT="$TMP_ROOT/audit.log"
LOCKS="$TMP_ROOT/locks"
mkdir -p "$LOCKS"
trap 'rm -rf "$TMP_ROOT"' EXIT

COMMON=(
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)

run_disk() {
    env "${COMMON[@]}" bash "$SCRIPT" "$@"
}

banner_line() { echo ""; echo "--- $* ---"; }

# ---------------------------------------------------------------------------
# usage
# ---------------------------------------------------------------------------

banner_line "usage --path <tmp>"
# Point --path at the tmp root - whatever filesystem that's on should have
# a df line. Anything unresolvable shows "(not available)".
out=$(run_disk usage --path "$TMP_ROOT" 2>&1)
echo "$out" | grep -q "DISK USAGE"  || fail "usage: missing banner"
echo "$out" | grep -q "Filesystem"  || fail "usage: missing header"
echo "$out" | grep -q "Last updated" || fail "usage: missing timestamp"
pass "usage: renders header + timestamp"

banner_line "usage with folder arg"
out=$(run_disk usage "$TMP_ROOT" --path "$TMP_ROOT" 2>&1)
echo "$out" | grep -q "Folder: $TMP_ROOT" || fail "usage: missing folder line"
pass "usage: includes folder du"

banner_line "usage with nonexistent folder"
out=$(run_disk usage "/path/that/does/not/exist/xyz" --path "$TMP_ROOT" 2>&1)
echo "$out" | grep -q "does not exist" || fail "usage: expected warning"
pass "usage: handles missing folder"

# ---------------------------------------------------------------------------
# cleanup
# ---------------------------------------------------------------------------

if command -v lsof >/dev/null 2>&1; then
    banner_line "cleanup --dry-run (no deleted FDs expected)"
    # Use a path prefix unlikely to match any real open deleted files so the
    # dry-run should report "No deleted files matching".
    out=$(run_disk cleanup "$TMP_ROOT/unreachable" --dry-run 2>&1)
    echo "$out" | grep -q "No deleted files matching" || fail "cleanup dry-run: wrong message (got: $out)"
    pass "cleanup --dry-run: nothing-matched path"
else
    echo "SKIP: cleanup - lsof not installed on this box"
fi

banner_line "cleanup missing path arg"
if run_disk cleanup --dry-run >/dev/null 2>&1; then
    fail "cleanup should require a path"
fi
pass "cleanup: rejects missing path"

# ---------------------------------------------------------------------------
# monitor
# ---------------------------------------------------------------------------

banner_line "monitor missing path"
if run_disk monitor >/dev/null 2>&1; then
    fail "monitor should require a path"
fi
pass "monitor: rejects missing path"

banner_line "monitor nonexistent dir"
if run_disk monitor "/path/that/does/not/exist/xyz" >/dev/null 2>&1; then
    fail "monitor should reject nonexistent dir"
fi
pass "monitor: rejects nonexistent dir"

# ---------------------------------------------------------------------------
# unknown op / help
# ---------------------------------------------------------------------------

banner_line "unknown op"
if run_disk bogus-op >/dev/null 2>&1; then
    fail "unknown op should fail"
fi
pass "unknown op rejected"

banner_line "--help"
out=$(run_disk --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "--help missing Usage:"
pass "--help works"

# ---------------------------------------------------------------------------
# audit trail
# ---------------------------------------------------------------------------

[[ -s "$AUDIT" ]]                       || fail "audit log empty"
grep -q "ops_disk.sh" "$AUDIT"          || fail "audit log missing script"
pass "audit log populated"

echo ""
echo "all ops_disk.sh checks passed"
