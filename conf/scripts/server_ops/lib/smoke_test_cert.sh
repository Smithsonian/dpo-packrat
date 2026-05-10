#!/bin/bash
#
# lib/smoke_test_cert.sh - dev-workstation preflight for ops_cert.sh
#
# Generates a live CA -> intermediate -> leaf chain via openssl in a
# scratch dir, plus a near-expiry leaf, plus a 4-block bundle for --strict.
# Asserts:
#
#   - --help works
#   - unknown op rejected
#   - inspect missing file exits non-zero
#   - inspect prints blocks, types, and key-match line when given key
#   - inspect --json emits parseable JSON with blocks array
#   - expiry --warn-days 365 on a 10-year leaf exits 0
#   - expiry --warn-days 99999 on a 10-year leaf exits 1 (will expire within)
#   - expiry on an already-expired leaf exits 1
#   - format 3-block passes (relaxed) and backs up the original
#   - format 3-block --strict rejects (needs exactly 4)
#   - format 4-block --strict passes
#   - audit log populated
#
# Exit 0 = all pass.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
SCRIPT="$OPS_DIR/ops_cert.sh"

[[ -x "$SCRIPT" ]] || chmod +x "$SCRIPT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }
banner_line() { echo ""; echo "--- $* ---"; }

if ! command -v openssl >/dev/null 2>&1; then
    echo "SKIP: openssl not installed - cannot exercise ops_cert.sh"
    exit 0
fi

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

AUDIT="$TMP_ROOT/audit.log"
LOCKS="$TMP_ROOT/locks"
PKI="$TMP_ROOT/pki"
mkdir -p "$LOCKS" "$PKI"
cd "$PKI"

RUN_ENV=(
    OPS_AUDIT_LOG="$AUDIT"
    OPS_LOCK_DIR="$LOCKS"
)
run_c() { env "${RUN_ENV[@]}" bash "$SCRIPT" "$@"; }

# ---------------------------------------------------------------------------
# Minimal CA + intermediate + leaf PKI (in-memory configs)
# ---------------------------------------------------------------------------

cat > openssl-ca.cnf <<'CNF'
[ req ]
distinguished_name = dn
prompt             = no
x509_extensions    = v3_ca
[ dn ]
CN = Packrat Smoke Test Root
[ v3_ca ]
basicConstraints = critical, CA:TRUE
keyUsage         = critical, keyCertSign, cRLSign
CNF

cat > openssl-intermediate.cnf <<'CNF'
[ req ]
distinguished_name = dn
prompt             = no
req_extensions     = v3_intermediate
[ dn ]
CN = Packrat Smoke Test Intermediate
[ v3_intermediate ]
basicConstraints = critical, CA:TRUE, pathlen:0
keyUsage         = critical, keyCertSign, cRLSign
CNF

cat > openssl-intermediate2.cnf <<'CNF'
[ req ]
distinguished_name = dn
prompt             = no
req_extensions     = v3_intermediate
[ dn ]
CN = Packrat Smoke Test Intermediate 2
[ v3_intermediate ]
basicConstraints = critical, CA:TRUE, pathlen:0
keyUsage         = critical, keyCertSign, cRLSign
CNF

cat > openssl-leaf.cnf <<'CNF'
[ req ]
distinguished_name = dn
prompt             = no
[ dn ]
CN = packrat-smoke.local
CNF

# Keys
openssl genrsa -out ca.key 2048 2>/dev/null
openssl genrsa -out int.key 2048 2>/dev/null
openssl genrsa -out int2.key 2048 2>/dev/null
openssl genrsa -out leaf.key 2048 2>/dev/null
openssl genrsa -out leaf_expired.key 2048 2>/dev/null

# Self-signed root
openssl req -x509 -new -key ca.key -days 3650 \
    -config openssl-ca.cnf -out ca.pem 2>/dev/null

# Intermediate signed by root
openssl req -new -key int.key -config openssl-intermediate.cnf -out int.csr 2>/dev/null
openssl x509 -req -in int.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
    -days 3650 -extfile openssl-intermediate.cnf -extensions v3_intermediate \
    -out int.pem 2>/dev/null

# Second intermediate signed by int (for the 4-block bundle)
openssl req -new -key int2.key -config openssl-intermediate2.cnf -out int2.csr 2>/dev/null
openssl x509 -req -in int2.csr -CA int.pem -CAkey int.key -CAcreateserial \
    -days 3650 -extfile openssl-intermediate2.cnf -extensions v3_intermediate \
    -out int2.pem 2>/dev/null

# Long-valid leaf signed by int (10 years)
openssl req -new -key leaf.key -config openssl-leaf.cnf -out leaf.csr 2>/dev/null
openssl x509 -req -in leaf.csr -CA int.pem -CAkey int.key -CAcreateserial \
    -days 3650 -out leaf.pem 2>/dev/null

# Expired leaf (-days 1, backdated via -not_before? openssl 1.1 doesn't
# have -not_before flag reliably; easier path: a 1-day cert that we
# pretend has been around. We won't actually wait a day, so instead we
# use a already-expired CA path: issue a leaf with -startdate/-enddate
# via -set_serial trick... too brittle. Use `faketime` if available,
# otherwise SKIP that sub-check.)
FAKETIME=""
if command -v faketime >/dev/null 2>&1; then
    FAKETIME="faketime"
fi

if [[ -n "$FAKETIME" ]]; then
    # Issue a leaf "1 year ago" valid for 30 days -> expired today
    $FAKETIME "-365 days" \
        openssl req -new -key leaf_expired.key -config openssl-leaf.cnf \
        -out leaf_expired.csr 2>/dev/null
    $FAKETIME "-365 days" \
        openssl x509 -req -in leaf_expired.csr -CA int.pem -CAkey int.key \
        -CAcreateserial -days 30 -out leaf_expired.pem 2>/dev/null
fi

# Assemble bundles
cat leaf.pem int.pem ca.pem        > bundle3.pem  # 3 blocks (relaxed)
cat leaf.pem int2.pem int.pem ca.pem > bundle4.pem  # 4 blocks (strict)

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

banner_line "--help prints usage"
out=$(run_c --help 2>&1)
echo "$out" | grep -q "Usage:" || fail "help missing 'Usage:'"
pass "--help works"

banner_line "unknown op rejected"
set +e
run_c bogus >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "unknown op should exit non-zero"
pass "unknown op rejected"

banner_line "inspect missing file errors"
set +e
out=$(run_c inspect /no/such/cert.pem 2>&1)
rc=$?
set -e
(( rc != 0 )) || fail "missing file should exit non-zero"
echo "$out" | grep -qi "not found" || fail "expected 'not found' message"
pass "inspect rejects missing file"

banner_line "inspect leaf.pem + key prints key-match"
out=$(run_c inspect leaf.pem leaf.key 2>&1)
echo "$out" | grep -q "block 1" || fail "expected block 1"
echo "$out" | grep -q "\[LEAF\]" || fail "expected LEAF type"
echo "$out" | grep -q "Key match  : yes" || fail "expected matching key line"
pass "inspect text + matching key"

banner_line "inspect leaf.pem + wrong key says no match"
out=$(run_c inspect leaf.pem int.key 2>&1)
echo "$out" | grep -q "Key match  : no" || fail "wrong key should say no match"
pass "inspect flags mismatched key"

banner_line "inspect --json on 3-block bundle parses"
# print_summary appends its own block after, so capture all output to a
# file and extract the line starting with '{'. Using an intermediate file
# avoids a SIGPIPE race between `grep -m1` closing early and ops_cert
# continuing to write the summary.
run_c inspect bundle3.pem --json > "$TMP_ROOT/json.out" 2>&1
json=$(grep -m1 '^{' "$TMP_ROOT/json.out" || true)
[[ -n "$json" ]] || fail "no JSON line emitted"
[[ "$json" == \{* && "$json" == *\} ]] || fail "JSON envelope malformed ($json)"
# If jq available, validate structure. Else sanity-grep.
if command -v jq >/dev/null 2>&1; then
    blocks=$(printf '%s' "$json" | jq -r '.blocks')
    [[ "$blocks" == "3" ]] || fail "expected blocks=3 (got $blocks)"
    types=$(printf '%s' "$json" | jq -r '.certs[].type' | tr '\n' ',')
    [[ "$types" == "LEAF,INTERMEDIATE,ROOT," ]] \
        || fail "unexpected type order: $types"
else
    echo "$json" | grep -q '"blocks":3' || fail "expected blocks:3"
    echo "$json" | grep -q '"type":"LEAF"' || fail "expected LEAF in JSON"
fi
pass "inspect --json structured output"

banner_line "expiry --warn-days 365 on long-valid leaf exits 0"
set +e
out=$(run_c expiry leaf.pem --warn-days 365 2>&1)
rc=$?
set -e
(( rc == 0 )) || fail "expected rc=0 (got $rc)"
echo "$out" | grep -q "\[OK" || fail "expected OK status"
pass "expiry long-valid passes"

banner_line "expiry on 10y leaf with --warn-days 99999 fails"
set +e
run_c expiry leaf.pem --warn-days 99999 >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "huge warn-days should trip a WARN"
pass "expiry WARN on threshold overshoot"

if [[ -n "$FAKETIME" && -f leaf_expired.pem ]]; then
    banner_line "expiry on expired leaf exits 1"
    set +e
    out=$(run_c expiry leaf_expired.pem --warn-days 0 2>&1)
    rc=$?
    set -e
    (( rc != 0 )) || fail "expired leaf should exit non-zero"
    echo "$out" | grep -q "EXPIRED" || fail "expected EXPIRED status"
    pass "expiry detects expired cert"
else
    echo "SKIP: faketime not installed - cannot build an already-expired cert"
fi

banner_line "expiry bad --warn-days rejected"
set +e
run_c expiry leaf.pem --warn-days nope >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "non-numeric --warn-days should fail"
pass "expiry rejects bad --warn-days"

banner_line "format 3-block bundle (relaxed)"
# Snapshot original so we can verify backup + mutation
orig_size=$(wc -c < bundle3.pem)
out=$(run_c format bundle3.pem 2>&1)
echo "$out" | grep -q "Rewrote" || fail "expected rewrite message"
ls bundle3.pem.bak.* >/dev/null 2>&1 || fail "no backup file created"
# Mutated file should NOT contain the ROOT anymore
if openssl x509 -in <(awk '/BEGIN/{n++}n==3' bundle3.pem | head) -noout -subject 2>/dev/null \
    | grep -q "Root"; then
    fail "root block still present after format"
fi
pass "format relaxed 3-block + backup"

banner_line "format 3-block --strict rejected"
cp bundle3.pem bundle3_for_strict.pem
set +e
run_c format bundle3_for_strict.pem --strict >/dev/null 2>&1
rc=$?
set -e
(( rc != 0 )) || fail "--strict with 3 blocks should fail"
pass "format --strict rejects non-4-block"

banner_line "format 4-block --strict passes"
out=$(run_c format bundle4.pem --strict 2>&1)
echo "$out" | grep -q "Rewrote" || fail "--strict on 4 blocks should rewrite"
ls bundle4.pem.bak.* >/dev/null 2>&1 || fail "no backup for 4-block"
pass "format --strict 4-block"

banner_line "audit log populated"
[[ -s "$AUDIT" ]] || fail "audit empty"
n=$(wc -l < "$AUDIT")
(( n > 8 )) || fail "too few audit lines ($n)"
grep -q "ops_cert.sh" "$AUDIT" || fail "audit missing script name"
grep -q "| OK "   "$AUDIT" || fail "missing OK in audit"
grep -q "| FAIL " "$AUDIT" || fail "missing FAIL in audit"
pass "audit log populated ($n lines)"

echo ""
echo "all ops_cert.sh checks passed"
