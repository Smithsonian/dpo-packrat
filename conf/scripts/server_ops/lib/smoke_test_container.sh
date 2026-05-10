#!/bin/bash
#
# lib/smoke_test_container.sh - dev-workstation preflight for ops_container.sh
#
# Stubs docker / systemctl / sudo / xargs on PATH so we can exercise the
# non-interactive dispatch paths without touching a real daemon. Asserts:
#
#   - --help works
#   - status without env lists all packrat-*
#   - status prod filters by -prod$, hides non-matching suffixes
#   - stop <protected-name> on prod is refused
#   - stop on staging with the same name (that only exists on prod) runs
#   - reclaim default does NOT prune builder cache
#   - reclaim --cache DOES prune builder cache
#   - pre-deploy dev runs all phases non-interactively, with --clean-cache
#   - pre-deploy default does NOT remount /tmp
#   - pre-deploy --remount-tmp calls sudo mount
#   - pre-deploy prod skips the protected container
#   - unknown op rejected
#   - audit log populated
#
# Exit 0 = all pass.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_container.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }
banner_line() { echo ""; echo "--- $* ---"; }

# ---------------------------------------------------------------------------
# Scratch env
# ---------------------------------------------------------------------------

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

BIN="$TMP_ROOT/bin"
AUDIT="$TMP_ROOT/audit.log"
LOCKS="$TMP_ROOT/locks"
DOCKER_LOG="$TMP_ROOT/docker.log"
SYSTEMCTL_LOG="$TMP_ROOT/systemctl.log"
SUDO_LOG="$TMP_ROOT/sudo.log"

mkdir -p "$BIN" "$LOCKS"

# ---------------------------------------------------------------------------
# docker stub
# ---------------------------------------------------------------------------
# Supports just enough subcommands to drive the paths under test:
#   ps -a [--filter name=...] [--format ...]
#   images --format ...
#   inspect -f ...
#   container|image|volume|network|builder|system prune [-f] [-a]
#   system df
#   stop|start|restart|rm|rmi <name>...
#
# All invocations are appended to $DOCKER_LOG.

cat > "$BIN/docker" <<EOF
#!/bin/bash
LOG="$DOCKER_LOG"
{ printf 'docker'; for a in "\$@"; do printf ' %q' "\$a"; done; echo; } >> "\$LOG"

# Canned container set: 4 on -prod, 2 on -dev, plus one non-packrat that
# must never match our filter.
all_containers=(
    "packrat-server-prod"
    "packrat-client-prod"
    "packrat-db-prod"
    "packrat-solr-prod"
    "packrat-server-dev"
    "packrat-solr-dev"
    "something-else"
)

all_images=(
    "packrat-server-prod IMGSERVPROD"
    "packrat-client-prod IMGCLIPROD"
    "packrat-solr-prod IMGSOLPROD"
    "packrat-server-dev IMGSERVDEV"
    "packrat-solr-dev IMGSOLDEV"
)

case "\$1" in
    ps)
        shift
        fmt=""
        while (( \$# > 0 )); do
            case "\$1" in
                -a) ;;
                --filter) shift ;;
                --filter=*) ;;
                --format) fmt="\$2"; shift ;;
                --format=*) fmt="\${1#--format=}" ;;
                -aq) aq=1 ;;
            esac
            shift
        done
        if [[ "\$fmt" == "{{.Names}}" ]]; then
            printf '%s\n' "\${all_containers[@]}"
        elif [[ "\$fmt" == *"table"* ]]; then
            printf 'NAMES\tSTATUS\tPORTS\n'
            for n in "\${all_containers[@]}"; do
                printf '%s\tUp 5min\t0.0.0.0:80->80\n' "\$n"
            done
        else
            for n in "\${all_containers[@]}"; do
                printf '%s\n' "\$n"
            done
        fi
        ;;
    images)
        shift
        fmt=""
        while (( \$# > 0 )); do
            case "\$1" in
                --format) fmt="\$2"; shift ;;
                --format=*) fmt="\${1#--format=}" ;;
            esac
            shift
        done
        printf '%s\n' "\${all_images[@]}"
        ;;
    inspect)
        # used to list named volumes; emit empty (no named volumes)
        ;;
    container|image|volume|network|builder|system)
        sub="\$1"; shift
        case "\$1" in
            prune) : ;;
            df)    echo "TYPE          TOTAL   ACTIVE  SIZE    RECLAIMABLE" ;;
        esac
        ;;
    stop|start|restart|rm|rmi)
        : # accept and return 0
        ;;
    *)
        # Unknown subcommand: echo so the log shows it
        ;;
esac
exit 0
EOF

# ---------------------------------------------------------------------------
# systemctl stub
# ---------------------------------------------------------------------------
cat > "$BIN/systemctl" <<EOF
#!/bin/bash
LOG="$SYSTEMCTL_LOG"
{ printf 'systemctl'; for a in "\$@"; do printf ' %q' "\$a"; done; echo; } >> "\$LOG"
exit 0
EOF

# ---------------------------------------------------------------------------
# sudo stub
# ---------------------------------------------------------------------------
# Transparent passthrough - logs invocation, then execs the remainder.
cat > "$BIN/sudo" <<EOF
#!/bin/bash
LOG="$SUDO_LOG"
{ printf 'sudo'; for a in "\$@"; do printf ' %q' "\$a"; done; echo; } >> "\$LOG"
if [[ \$# -eq 0 ]]; then exit 0; fi
# Special-case: 'sudo mount' - don't actually mount on the dev box.
if [[ "\$1" == "mount" ]]; then
    exit 0
fi
exec "\$@"
EOF

# ---------------------------------------------------------------------------
# mount stub - avoid the real mount ever running
# ---------------------------------------------------------------------------
cat > "$BIN/mount" <<'EOF'
#!/bin/bash
exit 0
EOF

chmod +x "$BIN"/{docker,systemctl,sudo,mount}

RUN_ENV=(
    PATH="$BIN:$PATH"
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)

run_c() {
    env "${RUN_ENV[@]}" bash "$SCRIPT" "$@"
}

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

banner_line "--help prints usage"
out=$(run_c --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "help missing 'Usage:'"
pass "--help works"

banner_line "unknown op rejected"
set +e
run_c does-not-exist </dev/null >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "unknown op should exit non-zero"
pass "unknown op rejected"

banner_line "status (no env) shows all packrat-*"
: > "$DOCKER_LOG"
out=$(run_c status 2>&1)
echo "$out" | grep -q "packrat-server-prod" || fail "prod entry missing"
echo "$out" | grep -q "packrat-server-dev"  || fail "dev  entry missing"
pass "status no-env shows all"

banner_line "status prod filters by suffix"
: > "$DOCKER_LOG"
out=$(run_c status prod 2>&1)
echo "$out" | grep -q "packrat-server-prod" || fail "missing server-prod"
echo "$out" | grep -q "packrat-solr-prod"   || fail "status should still SHOW protected (only destructive ops refuse)"
# Ensure no dev rows made it in
if echo "$out" | grep -q "packrat-server-dev"; then
    fail "status prod leaked -dev entry"
fi
pass "status prod suffix-filtered"

banner_line "stop prod packrat-solr-prod refused (protected)"
set +e
out=$(run_c stop prod packrat-solr-prod 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "stop on protected should exit non-zero"
echo "$out" | grep -q "protected production container" \
    || fail "missing protected message (out: $out)"
pass "protected container refusal"

banner_line "stop prod packrat-server-prod dispatches"
: > "$DOCKER_LOG"
out=$(run_c stop prod packrat-server-prod 2>&1)
grep -q "docker stop packrat-server-prod" "$DOCKER_LOG" \
    || fail "docker stop not invoked (log: $(cat "$DOCKER_LOG"))"
pass "stop prod non-protected"

banner_line "stop on staging rejected in non-TTY if no container-id"
set +e
run_c stop staging </dev/null >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "stop with no id + non-TTY should fail"
pass "stop requires container-id in non-TTY"

banner_line "reclaim default - no builder prune"
: > "$DOCKER_LOG"
run_c reclaim >/dev/null 2>&1
grep -qE "docker builder prune" "$DOCKER_LOG" \
    && fail "builder prune ran without --cache"
grep -q "docker image prune" "$DOCKER_LOG" \
    || fail "image prune expected"
grep -q "docker system df" "$DOCKER_LOG" \
    || fail "pre/post df expected"
df_count=$(grep -c "docker system df" "$DOCKER_LOG")
(( df_count == 2 )) || fail "expected 2 'docker system df' (pre+post), got $df_count"
pass "reclaim default conservative"

banner_line "reclaim --cache prunes builder"
: > "$DOCKER_LOG"
run_c reclaim --cache >/dev/null 2>&1
grep -qE "docker builder prune" "$DOCKER_LOG" \
    || fail "--cache should trigger builder prune"
pass "reclaim --cache prunes builder"

banner_line "reclaim bogus flag rejected"
set +e
run_c reclaim --nope >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "bogus flag should be rejected"
pass "reclaim rejects unknown flag"

banner_line "pre-deploy dev --user jenkins --clean-cache (non-interactive)"
: > "$DOCKER_LOG"
out=$(run_c pre-deploy dev --user jenkins --clean-cache 2>&1)
grep -q "docker stop" "$DOCKER_LOG"         || fail "expected docker stop"
grep -q "docker rm" "$DOCKER_LOG"           || fail "expected docker rm"
grep -q "docker rmi" "$DOCKER_LOG"          || fail "expected docker rmi"
grep -q "docker builder prune" "$DOCKER_LOG" || fail "--clean-cache should trigger builder prune"
grep -q "docker image prune" "$DOCKER_LOG"  || fail "expected image prune"
grep -q "docker network prune" "$DOCKER_LOG" || fail "expected network prune"
# /tmp remount must NOT have happened (no --remount-tmp)
grep -q "mount /tmp" "$SUDO_LOG" 2>/dev/null \
    && fail "/tmp remount ran without --remount-tmp"
pass "pre-deploy dev non-interactive"

banner_line "pre-deploy dev default - no builder prune, no /tmp remount"
: > "$DOCKER_LOG"; : > "$SUDO_LOG"
run_c pre-deploy dev --user jenkins >/dev/null 2>&1
grep -qE "docker builder prune" "$DOCKER_LOG" \
    && fail "builder prune ran without --clean-cache"
grep -q "mount /tmp" "$SUDO_LOG" 2>/dev/null \
    && fail "/tmp remount ran without --remount-tmp"
pass "pre-deploy dev conservative default"

banner_line "pre-deploy dev --remount-tmp calls sudo mount"
: > "$DOCKER_LOG"; : > "$SUDO_LOG"
run_c pre-deploy dev --user jenkins --remount-tmp >/dev/null 2>&1
grep -q "mount /tmp" "$SUDO_LOG" \
    || fail "--remount-tmp should invoke sudo mount /tmp (log: $(cat "$SUDO_LOG"))"
pass "pre-deploy --remount-tmp"

banner_line "pre-deploy prod skips protected container"
: > "$DOCKER_LOG"
run_c pre-deploy prod --user ericops >/dev/null 2>&1
# The xargs pipeline passes names through to docker stop/rm; the log
# must NOT contain solr-prod as a target.
if grep -qE "docker stop .*packrat-solr-prod" "$DOCKER_LOG"; then
    fail "stopped protected container on prod"
fi
if grep -qE "docker rm .*packrat-solr-prod" "$DOCKER_LOG"; then
    fail "removed protected container on prod"
fi
# But it SHOULD have targeted the other prod containers
grep -qE "docker stop .*packrat-server-prod" "$DOCKER_LOG" \
    || fail "expected server-prod to be stopped"
pass "pre-deploy prod honors protected filter"

banner_line "service restart (non-interactive) hits systemctl"
: > "$SYSTEMCTL_LOG"
run_c service restart </dev/null >/dev/null 2>&1
grep -q "systemctl restart docker" "$SYSTEMCTL_LOG" \
    || fail "service restart did not invoke systemctl (log: $(cat "$SYSTEMCTL_LOG"))"
pass "service restart dispatches"

banner_line "service bogus rejected"
set +e
run_c service nope </dev/null >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "service with bogus action should exit non-zero"
pass "service rejects unknown action"

banner_line "audit log populated"
[[ -s "$AUDIT" ]] || fail "audit log empty"
n=$(wc -l < "$AUDIT")
(( n > 8 )) || fail "audit log has too few lines ($n)"
grep -q "ops_container.sh" "$AUDIT" || fail "audit log missing script name"
grep -q "| OK "   "$AUDIT" || fail "audit log missing OK"
grep -q "| FAIL " "$AUDIT" || fail "audit log missing FAIL"
pass "audit log populated ($n lines)"

echo ""
echo "all ops_container.sh checks passed"
