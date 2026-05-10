#!/bin/bash
#
# lib/smoke_test_database.sh - dev-workstation preflight for ops_database.sh
#
# Exercises the non-interactive paths without needing a real MariaDB.
# We inject stub `mysql`, `mysqldump`, `zip` binaries on PATH that record
# their invocations to a log file and emit canned output. Credential
# discovery is pointed at a scratch .env.dev that the test writes itself.
#
# Covered:
#   - --help
#   - unknown op / unknown env
#   - prod drop/rebuild refusal
#   - metrics size (whole DB + --top N)
#   - metrics inspect (multi-section report)
#   - staging drop --yes (dispatches without prompting)
#   - staging rebuild --yes (runs all 4 SQL files)
#   - prune tier selector -> WHERE clause fed to mysql
#   - backup nozip -> .sql exists, registered as tmp
#   - backup interrupt -> partial .sql removed
#   - audit log populated
#
# Exit 0 = all pass; non-zero = a check failed.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_database.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }
banner_line() { echo ""; echo "--- $* ---"; }

# ---------------------------------------------------------------------------
# Scratch env
# ---------------------------------------------------------------------------

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

STAGING_ROOT="$TMP_ROOT/staging"
PROD_ROOT="$TMP_ROOT/prod"
AUDIT="$TMP_ROOT/audit.log"
LOCKS="$TMP_ROOT/locks"
BACKUPS="$TMP_ROOT/backups"
BIN="$TMP_ROOT/bin"
MYSQL_LOG="$TMP_ROOT/mysql.log"

mkdir -p "$STAGING_ROOT" "$PROD_ROOT" "$LOCKS" "$BACKUPS" "$BIN"
mkdir -p "$STAGING_ROOT/server/db/sql/scripts"
mkdir -p "$PROD_ROOT/server/db/sql/scripts"

# Scratch .env files the script will parse
cat > "$STAGING_ROOT/.env.dev" <<'ENV'
PACKRAT_DATABASE_URL=mysql://packrat:pw%40test@db.local:3306/Packrat
ENV
cat > "$PROD_ROOT/.env.prod" <<'ENV'
PACKRAT_DATABASE_URL=mysql://packrat:pw%40test@db.local:3306/PackratProduction
ENV

# SCHEMA/PROC/DATA files so `rebuild` can find them
for f in Packrat.DROP.sql Packrat.SCHEMA.sql Packrat.PROC.sql Packrat.DATA.sql; do
    echo "-- stub $f" > "$STAGING_ROOT/server/db/sql/scripts/$f"
    echo "-- stub $f" > "$PROD_ROOT/server/db/sql/scripts/$f"
done

# ---------------------------------------------------------------------------
# Stubs on PATH
# ---------------------------------------------------------------------------

cat > "$BIN/mysql" <<EOF
#!/bin/bash
# Record the invocation, then emit a canned response based on the SQL.
# Uses a single log for every call so the harness can assert on it.
LOG="$MYSQL_LOG"

# Detect the -e SQL up front so we can log it raw (not shell-escaped)
# and so the case/esac below can match against it.
sql=""
i=1
args=("\$@")
while (( i <= \$# )); do
    if [[ "\${args[i-1]}" == "-e" ]]; then
        sql="\${args[i]}"
        break
    fi
    i=\$((i+1))
done

{
    echo "--- mysql call ---"
    printf 'args: '
    for a in "\$@"; do printf '%q ' "\$a"; done
    echo
    if [[ -n "\$sql" ]]; then
        echo "--- sql ---"
        printf '%s\n' "\$sql"
        echo "--- end sql ---"
    fi
    # Capture stdin if any (used by mysql_exec_file)
    if [[ ! -t 0 ]]; then
        echo "--- stdin ---"
        cat
        echo "--- end stdin ---"
    fi
} >> "\$LOG"

# Fake responses so op_prune, metrics, etc. see plausible data.
case "\$sql" in
    *"COUNT(*) FROM Audit;"*)
        # total rows
        echo "1000"
        ;;
    *"COUNT(*) FROM Audit WHERE"*)
        # matched rows - return 0 so prune short-circuits "Nothing to prune"
        # unless MYSQL_STUB_MATCHED is set (tested path).
        echo "\${MYSQL_STUB_MATCHED:-0}"
        ;;
    *"DELETE FROM Audit"*)
        # Return 0 for ROW_COUNT so prune loop exits.
        echo "0"
        ;;
    *"information_schema.TABLES"*)
        echo "SomeTable  42  0.100  0.010  0.001  0.110"
        ;;
    *"information_schema.COLUMNS"*)
        # Pretend the inspected table has one Text column
        echo "Data"
        ;;
    *"@@datadir"*)
        echo "$TMP_ROOT/fakedatadir/"
        ;;
    *OPTIMIZE*)
        echo "ok"
        ;;
    *OCTET_LENGTH*)
        # Payload query against the auto-detected column
        echo "1000  950  1.234  56.789  0.050"
        ;;
    *)
        ;;
esac
exit 0
EOF

cat > "$BIN/mysqldump" <<EOF
#!/bin/bash
# Record the call, emit a fake dump at --result-file. Supports sleep-on-dump
# for the interrupt test.
{
    echo "--- mysqldump call ---"
    printf 'args: '
    for a in "\$@"; do printf '%q ' "\$a"; done
    echo
} >> "$MYSQL_LOG"

out=""
for a in "\$@"; do
    case "\$a" in
        --result-file=*) out="\${a#--result-file=}" ;;
    esac
done
[[ -n "\$out" ]] || exit 2

if [[ -n "\${MYSQLDUMP_STUB_SLEEP:-}" ]]; then
    # Write a header immediately so the file exists for the interrupt test,
    # then block long enough that the harness can send SIGINT.
    echo "-- partial dump header" > "\$out"
    sleep "\${MYSQLDUMP_STUB_SLEEP}"
fi

cat > "\$out" <<DUMP
-- fake dump
CREATE TABLE Foo (id INT);
DUMP
exit 0
EOF

cat > "$BIN/zip" <<'EOF'
#!/bin/bash
# Minimal zip stub for backup zip flag. Creates the output as a plain file
# (no real zip magic needed for our assertions).
out=""
src=""
for a in "$@"; do
    case "$a" in
        -*) ;;
        *)  if [[ -z "$out" ]]; then out="$a"; else src="$a"; fi ;;
    esac
done
[[ -n "$out" && -n "$src" ]] || exit 2
cp "$src" "$out"
exit 0
EOF

chmod +x "$BIN"/{mysql,mysqldump,zip}

# ---------------------------------------------------------------------------
# Common env for every invocation
# ---------------------------------------------------------------------------

RUN_ENV=(
    PATH="$BIN:$PATH"
    PROD_CODE_ROOT="$PROD_ROOT"
    STAGING_CODE_ROOT="$STAGING_ROOT"
    PROD_ENV_FILE="$PROD_ROOT/.env.prod"
    STAGING_ENV_FILE="$STAGING_ROOT/.env.dev"
    PROD_SQL_PATH="$PROD_ROOT/server/db/sql/scripts"
    STAGING_SQL_PATH="$STAGING_ROOT/server/db/sql/scripts"
    STAGING_DB_NAME="PackratStaging"
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)

run_db() {
    env "${RUN_ENV[@]}" bash "$SCRIPT" "$@"
}

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

banner_line "--help prints usage"
out=$(run_db --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "help missing 'Usage:'"
pass "--help works"

banner_line "unknown env rejected"
# Passing 'bogus' as arg 1 will NOT match any env token, so it becomes the
# OP. Then env prompting kicks in — but stdin is non-TTY, so read returns
# empty, normalize_env fails, and the script exits 1. We pipe /dev/null
# to short-circuit quickly.
if run_db bogus </dev/null >/dev/null 2>&1; then
    fail "unknown env should not succeed"
fi
pass "unknown env / no-op rejected"

banner_line "prod drop refused"
set +e
out=$(run_db prod drop --yes 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "prod drop should exit non-zero"
echo "$out" | grep -q "not permitted on production" || fail "missing rejection message"
pass "prod drop refused"

banner_line "prod rebuild refused"
set +e
out=$(run_db prod rebuild --yes 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "prod rebuild should exit non-zero"
pass "prod rebuild refused"

banner_line "unknown op rejected"
set +e
run_db staging does-not-exist >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "unknown op should exit non-zero"
pass "unknown op rejected"

banner_line "staging metrics size"
: > "$MYSQL_LOG"
out=$(run_db staging metrics size 2>&1)
echo "$out" | grep -q "METRICS SIZE" || fail "missing banner (out: $out)"
grep -q "information_schema.TABLES" "$MYSQL_LOG" || fail "size SQL not sent to mysql"
grep -q " LIMIT 20;" "$MYSQL_LOG" || fail "default --top 20 LIMIT not applied"
pass "metrics size (whole DB)"

banner_line "staging metrics size --top 5"
: > "$MYSQL_LOG"
run_db staging metrics size --top 5 >/dev/null 2>&1
grep -q " LIMIT 5;" "$MYSQL_LOG" || fail "explicit --top 5 not propagated"
pass "metrics size --top 5"

banner_line "metrics size bad --top"
set +e
run_db staging metrics size --top zero >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "bad --top should be rejected"
pass "metrics size rejects non-numeric --top"

banner_line "prod metrics inspect Audit"
: > "$MYSQL_LOG"
out=$(run_db prod metrics inspect Audit 2>&1)
echo "$out" | grep -q "METRICS INSPECT" || fail "missing inspect banner"
echo "$out" | grep -q -- "--- 1. Size ---" || fail "missing section 1"
echo "$out" | grep -q -- "--- 2. Bloat" || fail "missing section 2"
echo "$out" | grep -q -- "--- 3. Payload" || fail "missing section 3"
echo "$out" | grep -q -- "--- 4. Disk" || fail "missing section 4"
# Progress per fat column: we stubbed COLUMNS to return "Data"
echo "$out" | grep -q "\[column: Data\]" || fail "missing per-column progress line"
# Disk section should print the expected path even if not readable
echo "$out" | grep -q "PackratProduction/Audit.ibd" || fail "missing .ibd expected path"
pass "metrics inspect emits all 4 sections"

banner_line "inspect requires table"
set +e
run_db prod metrics inspect >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "inspect without table should fail"
pass "inspect requires table arg"

banner_line "staging drop --yes dispatches"
: > "$MYSQL_LOG"
out=$(run_db staging drop --yes 2>&1)
echo "$out" | grep -q "DROP DATABASE" || fail "drop banner missing"
grep -q "stub Packrat.DROP.sql" "$MYSQL_LOG" || fail "DROP.sql not piped to mysql"
pass "staging drop --yes"

banner_line "staging rebuild --yes runs all 4 SQL files"
: > "$MYSQL_LOG"
out=$(run_db staging rebuild --yes 2>&1)
for f in DROP SCHEMA PROC DATA; do
    grep -q "stub Packrat.$f.sql" "$MYSQL_LOG" || fail "Packrat.$f.sql not piped"
done
pass "staging rebuild --yes"

banner_line "prune tier1 (0 matched -> Nothing to prune)"
: > "$MYSQL_LOG"
out=$(run_db staging prune tier1 </dev/null 2>&1)
echo "$out" | grep -q "Nothing to prune" || fail "expected short-circuit"
grep -q "AuditType IN (6,7,10)" "$MYSQL_LOG" || fail "tier1 WHERE not sent"
pass "prune tier1 short-circuit"

banner_line "prune bogus tier rejected"
set +e
run_db staging prune tier99 </dev/null >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "bogus tier should exit non-zero"
pass "prune rejects bad tier"

banner_line "prune type:6:30 non-interactive"
: > "$MYSQL_LOG"
out=$(run_db staging prune type:6:30 </dev/null 2>&1)
grep -q "AuditType = 6" "$MYSQL_LOG" || fail "type selector WHERE not sent"
grep -q "INTERVAL 30 DAY" "$MYSQL_LOG" || fail "type age not applied"
pass "prune type:6:30"

banner_line "prune type:6 (missing age) non-interactive fails"
set +e
run_db staging prune type:6 </dev/null >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "missing age should fail in non-interactive"
pass "prune type:6 without age rejected"

banner_line "backup staging nozip"
: > "$MYSQL_LOG"
out=$(run_db staging backup "$BACKUPS" nozip 2>&1)
echo "$out" | grep -q "BACKUP DATABASE" || fail "missing banner"
sql_files=( "$BACKUPS"/PackratStaging.*.sql )
[[ -f "${sql_files[0]}" ]] || fail "no .sql produced"
grep -q "^-- fake dump" "${sql_files[0]}" || fail ".sql content missing"
# File must NOT still be registered as tmp (the outer-shell trap would
# have nuked it at successful EXIT; we verify by checking it exists here).
pass "backup nozip produces .sql"
rm -f "$BACKUPS"/PackratStaging.*.sql

banner_line "backup staging zip"
: > "$MYSQL_LOG"
out=$(run_db staging backup "$BACKUPS" zip 2>&1)
zip_files=( "$BACKUPS"/PackratStaging.*.sql.zip )
[[ -f "${zip_files[0]}" ]] || fail "no .sql.zip produced"
# Original .sql should have been removed after zip success
sql_leftover=( "$BACKUPS"/PackratStaging.*.sql )
for s in "${sql_leftover[@]}"; do
    [[ -f "$s" ]] && fail "leftover .sql after zip: $s"
done
pass "backup zip packages + removes .sql"
rm -f "$BACKUPS"/PackratStaging.*

banner_line "backup interrupted -> partial .sql removed"
# Use MYSQLDUMP_STUB_SLEEP so the stub writes a header then blocks.
# We kick off the backup in the background, SIGINT it, verify cleanup.
: > "$MYSQL_LOG"
(
    env "${RUN_ENV[@]}" MYSQLDUMP_STUB_SLEEP=5 \
        bash "$SCRIPT" staging backup "$BACKUPS" nozip >"$TMP_ROOT/bgout" 2>&1
) &
bg_pid=$!
# Give the script time to reach mysqldump
for _ in $(seq 1 40); do
    if compgen -G "$BACKUPS/PackratStaging.*.sql" >/dev/null; then
        break
    fi
    sleep 0.1
done
kill -INT "$bg_pid" 2>/dev/null || true
wait "$bg_pid" 2>/dev/null || true
# After cleanup, no .sql should remain in BACKUPS
leftover=( "$BACKUPS"/PackratStaging.*.sql )
for s in "${leftover[@]}"; do
    [[ -f "$s" ]] && fail "partial .sql not cleaned up: $s"
done
pass "interrupt cleans partial .sql"

banner_line "audit log populated"
[[ -s "$AUDIT" ]] || fail "audit log empty"
n=$(wc -l < "$AUDIT")
(( n > 8 )) || fail "audit log has too few lines ($n)"
grep -q "ops_database.sh" "$AUDIT" || fail "audit log missing script name"
grep -q "| OK " "$AUDIT"   || fail "audit log missing OK status"
grep -q "| FAIL " "$AUDIT" || fail "audit log missing FAIL status"
pass "audit log populated ($n lines)"

echo ""
echo "all ops_database.sh checks passed"
