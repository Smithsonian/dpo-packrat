#!/bin/bash
#
# lib/smoke_test_menu.sh - dev-workstation preflight for ops_menu.sh
#
# Replaces sibling ops_*.sh scripts with stubs that echo their args, so
# we can assert exact forwarding without needing the real domain scripts
# to succeed against their real dependencies.
#
# Covered:
#   - --help enumerates all 8 domains
#   - --list prints one line per <domain> <op>, total >= 32
#   - bogus domain returns non-zero
#   - dispatch forwards args verbatim
#   - dispatch exits with the child's exit code (via exec handoff)
#   - missing sibling script produces a clear error
#
# Exit 0 = all pass.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
MENU="$OPS_DIR/ops_menu.sh"

[[ -x "$MENU" ]] || chmod +x "$MENU"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }
banner_line() { echo ""; echo "--- $* ---"; }

# ---------------------------------------------------------------------------
# Scratch mirror of new_ops/ with stubbed sibling scripts
# ---------------------------------------------------------------------------

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

STUB_DIR="$TMP_ROOT/new_ops"
mkdir -p "$STUB_DIR/lib"
# Copy the real lib/ so common.sh is available to ops_menu.sh
cp -a "$OPS_DIR/lib/." "$STUB_DIR/lib/"
# Copy the menu itself
cp "$MENU" "$STUB_DIR/ops_menu.sh"
MENU="$STUB_DIR/ops_menu.sh"

FORWARD_LOG="$TMP_ROOT/forward.log"
: > "$FORWARD_LOG"

# Script names ops_menu.sh knows about
SIBLINGS=(
    ops_database.sh
    ops_logs.sh
    ops_disk.sh
    ops_system.sh
    ops_container.sh
    ops_solr.sh
    ops_data.sh
    ops_cert.sh
)

for s in "${SIBLINGS[@]}"; do
    cat > "$STUB_DIR/$s" <<EOF
#!/bin/bash
# stub - records its invocation, returns \${STUB_RC:-0}
LOG="$FORWARD_LOG"
{ printf '%s' "$s"; for a in "\$@"; do printf ' %q' "\$a"; done; echo; } >> "\$LOG"
exit "\${STUB_RC:-0}"
EOF
    chmod +x "$STUB_DIR/$s"
done

AUDIT="$TMP_ROOT/audit.log"

RUN_ENV=(
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$TMP_ROOT/locks"
)

run_m() { env "${RUN_ENV[@]}" bash "$MENU" "$@"; }

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

banner_line "--help lists 8 domains"
out=$(run_m --help 2>&1)
for key in database logs disk system container solr data cert; do
    echo "$out" | grep -qE "^ *${key} " || fail "--help missing '$key' row"
done
pass "--help enumerates all 8 domains"

banner_line "--list prints >= 32 op combinations"
: > "$FORWARD_LOG"
out=$(run_m --list 2>&1)
# Just the <domain> <op> lines (not the summary block)
combos=$(echo "$out" | awk '/^[a-z]+ +/{print}' | wc -l)
(( combos >= 32 )) || fail "expected >=32 ops, got $combos"
# Spot-check a couple of specific lines
echo "$out" | grep -q "database   metrics size"    || fail "missing 'database metrics size'"
echo "$out" | grep -q "container  pre-deploy"      || fail "missing 'container pre-deploy'"
echo "$out" | grep -q "cert       expiry"          || fail "missing 'cert expiry'"
pass "--list enumerates $combos combinations"

banner_line "bogus domain rejected"
set +e
out=$(run_m bogus 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "bogus domain should exit non-zero"
echo "$out" | grep -q "unknown domain" || fail "missing 'unknown domain' message"
pass "bogus domain rejected"

banner_line "dispatch forwards args verbatim"
: > "$FORWARD_LOG"
run_m database prod backup /backups zip >/dev/null 2>&1 || fail "dispatch failed"
# Stub should have logged exactly "ops_database.sh prod backup /backups zip"
grep -q "^ops_database.sh prod backup /backups zip$" "$FORWARD_LOG" \
    || fail "unexpected forwarded args: $(cat "$FORWARD_LOG")"
pass "dispatch forwards args"

banner_line "dispatch exits with child's rc (exec handoff)"
set +e
env "${RUN_ENV[@]}" STUB_RC=42 bash "$MENU" logs prod tail >/dev/null 2>&1
rc=$?
set -e
(( rc == 42 )) || fail "expected rc=42, got $rc"
pass "exec-style handoff preserves child rc"

banner_line "dispatch to every domain routes to its script"
for d in database logs disk system container solr data cert; do
    : > "$FORWARD_LOG"
    run_m "$d" --help >/dev/null 2>&1 || true
    expected_stub="ops_${d}.sh"
    # cert/logs/disk/system/solr/data use plural/singular variants, but
    # all follow the ops_<key>.sh naming rule - except 'container'.
    case "$d" in
        container) expected_stub="ops_container.sh" ;;
    esac
    grep -q "^${expected_stub} --help$" "$FORWARD_LOG" \
        || fail "domain '$d' did not route to $expected_stub (got: $(cat "$FORWARD_LOG"))"
done
pass "all 8 domains route correctly"

banner_line "missing sibling script produces clear error"
# Delete one stub so we can trigger the 'not executable or missing' path
rm -f "$STUB_DIR/ops_cert.sh"
set +e
out=$(run_m cert inspect /tmp/nope 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "missing sibling should return non-zero"
echo "$out" | grep -q "sibling script" || fail "missing 'sibling script' error"
pass "missing sibling reported clearly"

banner_line "audit log populated"
# Only non-exec paths write to audit log from ops_menu.sh itself. The
# dispatched stubs don't write their own audit lines (they're stubs).
# So we just need at least a couple of entries from the --list / --help /
# bogus / missing-sibling paths.
[[ -s "$AUDIT" ]] || fail "audit empty"
n=$(wc -l < "$AUDIT")
(( n >= 3 )) || fail "too few audit lines ($n) - expected at least 3 from non-exec paths"
grep -q "ops_menu.sh" "$AUDIT" || fail "audit missing script name"
pass "audit log populated ($n lines)"

echo ""
echo "all ops_menu.sh checks passed"
