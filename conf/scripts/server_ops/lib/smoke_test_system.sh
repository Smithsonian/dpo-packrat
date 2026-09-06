#!/bin/bash
#
# lib/smoke_test_system.sh - dev-workstation preflight for ops_system.sh
#
# Covers the non-blocking paths: procinfo (top5 + pid), perf arg-parse
# rejection, files/remount arg rejection, --help, unknown op. monitor and
# files loop forever so they're exercised only for their error paths.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_system.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

TMP_ROOT="$(mktemp -d)"
AUDIT="$TMP_ROOT/audit.log"
LOCKS="$TMP_ROOT/locks"
mkdir -p "$LOCKS"
trap 'rm -rf "$TMP_ROOT"' EXIT

COMMON=(OPS_AUDIT_LOG="$AUDIT" OPS_LOCK_DIR="$LOCKS")

run_sys() { env "${COMMON[@]}" bash "$SCRIPT" "$@"; }
section() { echo ""; echo "--- $* ---"; }

# ---------------------------------------------------------------------------
# procinfo
# ---------------------------------------------------------------------------

# Probe whether the host has procps-style ps (supports -o format specs).
# Git-bash on Windows ships a minimal ps that lacks this.
PS_HAS_DASH_O=0
if command -v ps >/dev/null 2>&1; then
    # Test both forms our script uses (-Ao and -p <pid> -o)
    if ps -Ao pid,comm >/dev/null 2>&1 && ps -p $$ -o pid >/dev/null 2>&1; then
        PS_HAS_DASH_O=1
    fi
fi

section "procinfo (no pid -> top 5)"
if (( PS_HAS_DASH_O == 1 )); then
    out=$(run_sys procinfo 2>&1)
    echo "$out" | grep -q "TOP 5 PROCESSES"  || fail "procinfo: no top-5 banner"
    echo "$out" | grep -q "To see detail"    || fail "procinfo: missing usage hint"
    pass "procinfo: top-5 + hint"
else
    echo "SKIP: procinfo top-5 (minimal ps - run on target server to verify)"
fi

section "procinfo with real pid"
if (( PS_HAS_DASH_O == 1 )); then
    mypid=$$
    out=$(run_sys procinfo "$mypid" 2>&1)
    echo "$out" | grep -q "$mypid" || fail "procinfo: pid not in output"
    pass "procinfo: real pid"
else
    echo "SKIP: procinfo pid-detail (minimal ps)"
fi

section "procinfo non-numeric pid"
if run_sys procinfo notapid >/dev/null 2>&1; then
    fail "procinfo should reject non-numeric pid"
fi
pass "procinfo: rejects non-numeric"

section "procinfo bogus pid"
if run_sys procinfo 99999999 >/dev/null 2>&1; then
    fail "procinfo should reject missing pid"
fi
pass "procinfo: rejects nonexistent pid"

# ---------------------------------------------------------------------------
# perf argument parsing
# ---------------------------------------------------------------------------

section "perf rejects unknown size"
# Use a size no parser branch accepts
if run_sys perf 5G >/dev/null 2>&1; then
    fail "perf should reject unknown size"
fi
pass "perf: rejects bad size"

# ---------------------------------------------------------------------------
# files argument parsing
# ---------------------------------------------------------------------------

section "files rejects missing path"
if run_sys files >/dev/null 2>&1; then
    fail "files should require a path"
fi
pass "files: rejects missing path"

section "files rejects nonexistent dir"
if run_sys files "/does/not/exist/xyz" >/dev/null 2>&1; then
    fail "files should reject nonexistent dir"
fi
pass "files: rejects nonexistent dir"

# ---------------------------------------------------------------------------
# remount - don't actually run; just check it refuses without sudo
# ---------------------------------------------------------------------------

section "remount refuses without privs (dev workstation)"
# On a dev workstation with no passwordless sudo + no MOUNT_POINT, we expect
# either a privilege error OR a failed umount. Both are non-zero exits.
# We feed 'yes' just to get past the confirm prompt in case EUID=0 test envs.
if command -v sudo >/dev/null 2>&1; then
    if echo "n" | run_sys remount >/dev/null 2>&1; then
        fail "remount should not succeed on a dev workstation"
    fi
    pass "remount: fails safely on dev"
else
    echo "SKIP: remount (sudo missing)"
fi

# ---------------------------------------------------------------------------
# unknown op / help
# ---------------------------------------------------------------------------

section "unknown op"
if run_sys definitely-not-a-real-op >/dev/null 2>&1; then
    fail "unknown op should fail"
fi
pass "unknown op rejected"

section "--help"
out=$(run_sys --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "--help missing Usage:"
pass "--help works"

# ---------------------------------------------------------------------------
# audit trail
# ---------------------------------------------------------------------------

[[ -s "$AUDIT" ]]              || fail "audit log empty"
grep -q "ops_system.sh" "$AUDIT" || fail "audit log missing script"
pass "audit log populated"

echo ""
echo "all ops_system.sh checks passed"
