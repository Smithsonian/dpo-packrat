#!/bin/bash
#
# ops_cert.sh - Packrat certificate operations (inspect / format / expiry)
#
# Replaces: ops_inspectCert.sh, ops_formatCert.sh
#
# Usage:
#   ./ops_cert.sh                                   # fully interactive menu
#   ./ops_cert.sh <op> <file> [args...]             # non-interactive
#
# Subcommands:
#   inspect [file] [keyfile] [--json]               # per-block details, optional key-match
#                                                   # no <file> -> walks $CERT_DEFAULTS
#   format  <file> [--strict]                       # reorder LEAF + intermediates; omit root
#                                                   # --strict requires exactly 4 blocks
#   expiry  [file] [--warn-days N]                  # exit 1 if ANY cert expires within N days
#                                                   # default N = 30
#                                                   # no <file> -> walks $CERT_DEFAULTS
#
# Cert ops are path-keyed, not env-keyed, so no env prompt is shown.
#
# Default certs (used when <file> is omitted on inspect/expiry):
#   /etc/pki/tls/certs/packrat.si.edu.cert        (prod)
#   /etc/pki/tls/certs/packrat-test.si.edu.cert   (staging/test)
# Override via $CERT_DEFAULT_FILES (whitespace-separated path list).
#
# Dependencies (checked per-op):
#   openssl (all subops)
#   file    (inspect/format: auto-detect PKCS#7/DER)
#
# Examples:
#   ./ops_cert.sh inspect                                  # default Packrat certs
#   ./ops_cert.sh inspect /etc/pki/tls/certs/packrat.si.edu.cert
#   ./ops_cert.sh inspect bundle.pem server.key --json
#   ./ops_cert.sh format  bundle.pem
#   ./ops_cert.sh expiry  --warn-days 14                   # default Packrat certs
#   ./ops_cert.sh expiry  /etc/ssl/packrat.pem --warn-days 14
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_cert.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"

init_traps

# ---------------------------------------------------------------------------
# Default certificate locations
# ---------------------------------------------------------------------------
#
# When inspect/expiry are run without a <file> arg, they iterate over the
# certs Packrat actually serves. Sourced from conf/nginx/nginx-prod.conf:
#   ssl_certificate "/etc/pki/tls/certs/packrat.si.edu.cert";
#   ssl_certificate "/etc/pki/tls/certs/packrat-test.si.edu.cert";
# Override via $CERT_DEFAULT_FILES (whitespace-separated list).

if [[ -n "${CERT_DEFAULT_FILES:-}" ]]; then
    # Operator-provided list (whitespace-separated path string).
    read -r -a CERT_DEFAULTS <<< "$CERT_DEFAULT_FILES"
else
    CERT_DEFAULTS=(
        "/etc/pki/tls/certs/packrat.si.edu.cert"
        "/etc/pki/tls/certs/packrat-test.si.edu.cert"
    )
fi

# ---------------------------------------------------------------------------
# Shared PEM helpers
# ---------------------------------------------------------------------------
#
# All three subops need to normalize the input (PKCS#7 / DER -> PEM) and
# split into numbered per-cert files. Extracted here so inspect/format/
# expiry share one code path.

# Strip CR, detect PKCS#7 / DER / PEM, leave the result in $1/src.pem.
# Returns 0 on success, 2 if the input cannot be coerced to PEM.
pem_normalize() {
    local workdir="$1"
    local src_file="$2"
    local out="$workdir/src.pem"
    tr -d '\r' < "$src_file" > "$out" || true
    if grep -q "BEGIN CERTIFICATE" "$out" 2>/dev/null \
       || grep -q "BEGIN TRUSTED CERTIFICATE" "$out" 2>/dev/null; then
        return 0
    fi
    # Not PEM - try PKCS#7 then DER.
    local ft=""
    if command -v file >/dev/null 2>&1; then
        ft=$(file -b "$src_file" 2>/dev/null || true)
    fi
    if [[ "$ft" == *"PKCS #7"* || "$ft" == *"p7b"* ]]; then
        if ! openssl pkcs7 -print_certs -in "$src_file" -out "$out" >/dev/null 2>&1; then
            err "failed to convert PKCS#7 to PEM: $src_file"
            return 2
        fi
        return 0
    fi
    if ! openssl x509 -inform DER -in "$src_file" -out "$out" >/dev/null 2>&1; then
        err "input is not readable PEM / DER / PKCS#7: $src_file"
        return 2
    fi
    return 0
}

# Split $workdir/src.pem into $workdir/cert_01.pem, cert_02.pem, ...
# (Leaves the caller to glob them back with shopt -s nullglob.)
pem_split() {
    local workdir="$1"
    awk -v outdir="$workdir" '
        /BEGIN (TRUSTED )?CERTIFICATE/ { inblk=1; idx++; fn=sprintf("%s/cert_%02d.pem", outdir, idx) }
        inblk { print > fn }
        /END (TRUSTED )?CERTIFICATE/ { inblk=0; close(fn) }
    ' "$workdir/src.pem"
}

cert_subject()  { openssl x509 -in "$1" -noout -subject 2>/dev/null | sed 's/^subject= *//'; }
cert_issuer()   { openssl x509 -in "$1" -noout -issuer  2>/dev/null | sed 's/^issuer= *//'; }
cert_notbefore() { openssl x509 -in "$1" -noout -startdate 2>/dev/null | sed 's/^notBefore=//'; }
cert_notafter()  { openssl x509 -in "$1" -noout -enddate   2>/dev/null | sed 's/^notAfter=//'; }
cert_is_ca()    { openssl x509 -in "$1" -noout -text 2>/dev/null | grep -q "CA:TRUE"; }
cert_self_signed() { [[ "$(cert_subject "$1")" == "$(cert_issuer "$1")" ]]; }

cert_type() {
    if cert_is_ca "$1"; then
        if cert_self_signed "$1"; then
            echo "ROOT"
        else
            echo "INTERMEDIATE"
        fi
    else
        echo "LEAF"
    fi
}

# Public key fingerprint (sha256) for a cert or a key file.
pubkey_fp_cert() {
    openssl x509 -in "$1" -noout -pubkey 2>/dev/null \
        | openssl pkey -pubin -outform pem 2>/dev/null \
        | sha256sum | awk '{print $1}'
}

pubkey_fp_key() {
    openssl pkey -in "$1" -pubout -outform pem 2>/dev/null \
        | sha256sum | awk '{print $1}'
}

# Convert an openssl notAfter string ("Oct 26 12:34:56 2026 GMT") to
# an epoch. `date -d` on GNU systems handles this directly.
notafter_epoch() {
    local na="$1"
    date -d "$na" +%s 2>/dev/null
}

# ---------------------------------------------------------------------------
# Operation: inspect
# ---------------------------------------------------------------------------

op_inspect() {
    OPS_CURRENT_OP="inspect"
    local cert_file="" key_file="" json=false
    while (( $# > 0 )); do
        case "$1" in
            --json)    json=true ;;
            -h|--help)
                echo "usage: ops_cert.sh inspect [file] [keyfile] [--json]"
                echo "  with no <file>: iterates over CERT_DEFAULTS (${CERT_DEFAULTS[*]})"
                return 0
                ;;
            *)
                if   [[ -z "$cert_file" ]]; then cert_file="$1"
                elif [[ -z "$key_file"  ]]; then key_file="$1"
                else err "inspect: unexpected arg '$1'"; return 1
                fi
                ;;
        esac
        shift
    done

    if [[ -n "$key_file" && ! -f "$key_file" ]]; then
        err "keyfile not found: $key_file"
        return 1
    fi

    # No file -> walk the defaults. Key-match check is incompatible with
    # batch mode (which key matches which cert?) so refuse that combo.
    if [[ -z "$cert_file" ]]; then
        if [[ -n "$key_file" ]]; then
            err "inspect: --keyfile requires an explicit <file>"
            return 1
        fi
        local f rc=0 missing=0
        for f in "${CERT_DEFAULTS[@]}"; do
            if [[ ! -f "$f" ]]; then
                warn "default cert not found, skipping: $f"
                missing=$(( missing + 1 ))
                continue
            fi
            __inspect_one "$f" "" "$json" || rc=$?
        done
        if (( missing == ${#CERT_DEFAULTS[@]} )); then
            err "no default cert files were readable"
            return 1
        fi
        return $rc
    fi

    if [[ ! -f "$cert_file" ]]; then
        err "file not found: $cert_file"
        return 1
    fi

    __inspect_one "$cert_file" "$key_file" "$json"
}

# Run inspect against one cert file. Hoisted out so the multi-file path
# can call it in a loop with each default.
__inspect_one() {
    local cert_file="$1" key_file="$2" json="$3"

    require_cmd openssl sha256sum awk || return 127

    local workdir
    workdir=$(mktemp -d)
    register_tmp_file "$workdir"

    pem_normalize "$workdir" "$cert_file" || return $?
    pem_split "$workdir"

    shopt -s nullglob
    local -a certs=( "$workdir"/cert_*.pem )
    local count=${#certs[@]}
    if (( count == 0 )); then
        err "no certificate blocks found in $cert_file"
        return 3
    fi

    local key_fp=""
    if [[ -n "$key_file" ]]; then
        key_fp=$(pubkey_fp_key "$key_file")
    fi

    if [[ "$json" == "true" ]]; then
        emit_inspect_json "$cert_file" "$key_fp" "${certs[@]}"
    else
        emit_inspect_text "$cert_file" "$key_fp" "${certs[@]}"
    fi
}

emit_inspect_text() {
    local src="$1"; shift
    local key_fp="$1"; shift
    local certs=("$@")
    local count=${#certs[@]}

    banner "CERT INSPECT"
    echo "File   : $src"
    echo "Blocks : $count"
    [[ -n "$key_fp" ]] && echo "Key-FP : (provided, will compare per-block)"
    echo ""

    local i=0 f type subj issr nb na cert_fp
    for f in "${certs[@]}"; do
        i=$((i+1))
        subj=$(cert_subject "$f")
        issr=$(cert_issuer  "$f")
        nb=$(cert_notbefore "$f")
        na=$(cert_notafter  "$f")
        type=$(cert_type "$f")
        echo "=== block $i  [$type] ==="
        echo "Subject    : $subj"
        echo "Issuer     : $issr"
        echo "Valid From : $nb"
        echo "Valid To   : $na"
        if [[ -n "$key_fp" ]]; then
            cert_fp=$(pubkey_fp_cert "$f")
            if [[ -n "$cert_fp" && "$cert_fp" == "$key_fp" ]]; then
                echo "Key match  : yes"
            else
                echo "Key match  : no"
            fi
        fi
        hr
    done
}

emit_inspect_json() {
    local src="$1"; shift
    local key_fp="$1"; shift
    local certs=("$@")
    local count=${#certs[@]}

    # Hand-rolled JSON (no jq dependency). Values are escaped minimally -
    # subjects can contain quotes and commas but not usually backslashes.
    local i f subj issr nb na type cert_fp key_match
    printf '{'
    printf '"file":"%s",' "$(__json_escape "$src")"
    printf '"blocks":%d,' "$count"
    printf '"certs":['
    for (( i=0; i<count; i++ )); do
        f="${certs[i]}"
        subj=$(cert_subject "$f")
        issr=$(cert_issuer  "$f")
        nb=$(cert_notbefore "$f")
        na=$(cert_notafter  "$f")
        type=$(cert_type "$f")
        (( i > 0 )) && printf ','
        printf '{"index":%d,"type":"%s","subject":"%s","issuer":"%s","notBefore":"%s","notAfter":"%s"' \
            $((i+1)) "$type" \
            "$(__json_escape "$subj")" "$(__json_escape "$issr")" \
            "$(__json_escape "$nb")" "$(__json_escape "$na")"
        if [[ -n "$key_fp" ]]; then
            cert_fp=$(pubkey_fp_cert "$f")
            if [[ -n "$cert_fp" && "$cert_fp" == "$key_fp" ]]; then
                key_match="true"
            else
                key_match="false"
            fi
            printf ',"keyMatch":%s' "$key_match"
        fi
        printf '}'
    done
    printf ']}'
    echo
}

# Minimal JSON string escape: \ " and control chars.
__json_escape() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

# ---------------------------------------------------------------------------
# Operation: format
# ---------------------------------------------------------------------------

op_format() {
    OPS_CURRENT_OP="format"
    local cert_file="" strict=false
    while (( $# > 0 )); do
        case "$1" in
            --strict) strict=true ;;
            -h|--help)
                echo "usage: ops_cert.sh format <file> [--strict]"
                return 0
                ;;
            *)
                if [[ -z "$cert_file" ]]; then cert_file="$1"
                else err "format: unexpected arg '$1'"; return 1
                fi
                ;;
        esac
        shift
    done
    if [[ -z "$cert_file" ]]; then
        err "format requires <file>"
        return 1
    fi
    if [[ ! -f "$cert_file" ]]; then
        err "file not found: $cert_file"
        return 1
    fi

    require_cmd openssl awk || return 127

    local workdir
    workdir=$(mktemp -d)
    register_tmp_file "$workdir"

    pem_normalize "$workdir" "$cert_file" || return $?
    pem_split "$workdir"

    shopt -s nullglob
    local -a certs=( "$workdir"/cert_*.pem )
    local count=${#certs[@]}

    banner "CERT FORMAT"
    echo "File    : $cert_file"
    echo "Blocks  : $count"
    echo "Strict  : $strict"
    echo ""

    if $strict && (( count != 4 )); then
        err "strict mode requires exactly 4 blocks (got $count)"
        return 3
    fi
    # Relaxed minimum: need at least 1 leaf + 1 intermediate (or root).
    if (( count < 2 )); then
        err "format requires a bundle of 2+ certificates (got $count)"
        return 3
    fi

    # Classify blocks
    local leaf="" root=""
    local -a interms=()
    local f
    for f in "${certs[@]}"; do
        if cert_is_ca "$f"; then
            if cert_self_signed "$f"; then
                root="$f"
            else
                interms+=("$f")
            fi
        else
            [[ -z "$leaf" ]] && leaf="$f"
        fi
    done

    if [[ -z "$leaf" ]]; then
        err "could not identify a LEAF (CA:FALSE) certificate"
        return 4
    fi
    if (( ${#interms[@]} == 0 )); then
        err "no intermediate certificates found - nothing to order"
        return 4
    fi

    # Chain intermediates issuer->subject starting from the leaf's issuer
    local current
    current="$(cert_issuer "$leaf")"
    local -a ordered=()
    local -a remaining=( "${interms[@]}" )
    while (( ${#remaining[@]} > 0 )); do
        local found=0 i=0
        for i in "${!remaining[@]}"; do
            f="${remaining[$i]}"
            if [[ "$(cert_subject "$f")" == "$current" ]]; then
                ordered+=("$f")
                current="$(cert_issuer "$f")"
                unset 'remaining[i]'
                remaining=( "${remaining[@]}" )
                found=1
                break
            fi
        done
        (( found == 0 )) && break
    done
    if (( ${#remaining[@]} > 0 )); then
        warn "${#remaining[@]} intermediate(s) could not be chained; appending as-is"
        ordered+=( "${remaining[@]}" )
    fi

    # Backup + rewrite LEAF + INTERMEDIATES (root omitted)
    local ts backup
    ts=$(date +%Y%m%d%H%M%S)
    backup="${cert_file}.bak.${ts}"
    cp -p -- "$cert_file" "$backup"
    note "backup: $backup"

    {
        cat "$leaf"
        for f in "${ordered[@]}"; do
            cat "$f"
        done
    } > "$cert_file"

    echo ""
    echo "Rewrote $cert_file as LEAF + INTERMEDIATE(S) (root omitted):"
    echo "  LEAF         : $(cert_subject "$leaf")"
    for f in "${ordered[@]}"; do
        echo "  INTERMEDIATE : $(cert_subject "$f")"
    done
    if [[ -n "$root" ]]; then
        echo ""
        note "ROOT '$(cert_subject "$root")' omitted from output"
    fi
}

# ---------------------------------------------------------------------------
# Operation: expiry
# ---------------------------------------------------------------------------

op_expiry() {
    OPS_CURRENT_OP="expiry"
    local cert_file="" warn_days=30
    while (( $# > 0 )); do
        case "$1" in
            --warn-days)   warn_days="${2:-}"; shift 2; continue ;;
            --warn-days=*) warn_days="${1#--warn-days=}" ;;
            -h|--help)
                echo "usage: ops_cert.sh expiry [file] [--warn-days N]"
                echo "  with no <file>: iterates over CERT_DEFAULTS (${CERT_DEFAULTS[*]})"
                return 0
                ;;
            *)
                if [[ -z "$cert_file" ]]; then cert_file="$1"
                else err "expiry: unexpected arg '$1'"; return 1
                fi
                ;;
        esac
        shift
    done
    if ! [[ "$warn_days" =~ ^[0-9]+$ ]]; then
        err "--warn-days must be a non-negative integer (got: '$warn_days')"
        return 1
    fi

    # No file -> walk the defaults. Aggregate exit code: 1 if ANY default
    # is bad/expired (cron-friendly), 0 only if all are OK.
    if [[ -z "$cert_file" ]]; then
        local f any_bad=0 missing=0
        for f in "${CERT_DEFAULTS[@]}"; do
            if [[ ! -f "$f" ]]; then
                warn "default cert not found, skipping: $f"
                missing=$(( missing + 1 ))
                continue
            fi
            if ! __expiry_one "$f" "$warn_days"; then
                any_bad=1
            fi
        done
        if (( missing == ${#CERT_DEFAULTS[@]} )); then
            err "no default cert files were readable"
            return 1
        fi
        (( any_bad )) && return 1
        return 0
    fi

    if [[ ! -f "$cert_file" ]]; then
        err "file not found: $cert_file"
        return 1
    fi
    __expiry_one "$cert_file" "$warn_days"
}

# Run expiry against one cert file. Returns 0 when every block is OK,
# 1 when any block is WARN / EXPIRED / UNKNOWN.
__expiry_one() {
    local cert_file="$1" warn_days="$2"

    require_cmd openssl awk date || return 127

    local workdir
    workdir=$(mktemp -d)
    register_tmp_file "$workdir"

    pem_normalize "$workdir" "$cert_file" || return $?
    pem_split "$workdir"

    shopt -s nullglob
    local -a certs=( "$workdir"/cert_*.pem )
    local count=${#certs[@]}
    if (( count == 0 )); then
        err "no certificate blocks found in $cert_file"
        return 3
    fi

    banner "CERT EXPIRY"
    echo "File      : $cert_file"
    echo "Blocks    : $count"
    echo "Warn-days : $warn_days"
    echo ""

    local now
    now=$(date +%s)
    local threshold=$(( now + warn_days * 86400 ))

    local any_bad=0 i=0 f na na_epoch days_left status
    for f in "${certs[@]}"; do
        i=$((i+1))
        na=$(cert_notafter "$f")
        na_epoch=$(notafter_epoch "$na")
        if [[ -z "$na_epoch" ]]; then
            status="UNKNOWN"
            any_bad=1
            printf 'block %d [%s]  notAfter=%s  days=?\n' "$i" "$status" "$na"
            continue
        fi
        days_left=$(( (na_epoch - now) / 86400 ))
        if (( na_epoch < now )); then
            status="EXPIRED"
            any_bad=1
        elif (( na_epoch < threshold )); then
            status="WARN"
            any_bad=1
        else
            status="OK"
        fi
        printf 'block %d [%-7s] %-16s notAfter=%s  days=%d\n' \
            "$i" "$status" "$(cert_type "$f")" "$na" "$days_left"
    done

    if (( any_bad )); then
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    menu_clear
    banner "PACKRAT CERT OPS"
    echo "[1] Inspect - per-block details (read-only)"
    echo "[2] Format  - !! rewrite cert bundle in place (.bak.* saved first)"
    echo "[3] Expiry  - check days remaining (exit 1 if within warn-days)"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c arg keyarg
    read -r -p "Choose: " c
    case "$c" in
        1)
            read -r -p "Cert file (blank=Packrat defaults): " arg
            read -r -p "Key file (optional, blank to skip): " keyarg
            if [[ -n "$arg" && -n "$keyarg" ]]; then
                run_op op_inspect "$arg" "$keyarg" || return $MENU_RC_QUIT
            elif [[ -n "$arg" ]]; then
                run_op op_inspect "$arg" || return $MENU_RC_QUIT
            else
                run_op op_inspect || return $MENU_RC_QUIT
            fi
            ;;
        2)
            read -r -p "Cert file: " arg
            run_op op_format "$arg" || return $MENU_RC_QUIT
            ;;
        3)
            read -r -p "Cert file (blank=Packrat defaults): " arg
            if [[ -n "$arg" ]]; then
                run_op op_expiry "$arg" || return $MENU_RC_QUIT
            else
                run_op op_expiry || return $MENU_RC_QUIT
            fi
            ;;
        [Bb]) return $MENU_RC_BACK ;;
        [Qq]) return $MENU_RC_QUIT ;;
        *) err "invalid choice" ;;
    esac
    return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() {
    sed -n '2,38p' "$0"
}

case "${1:-}" in
    -h|--help) print_help; exit 0 ;;
esac

OP="${1:-}"
[[ -n "$OP" ]] && shift

status="OK"
rc=0

if [[ -z "$OP" ]]; then
    menu_clear
    while :; do
        main_menu
        menu_rc=$?
        case "$menu_rc" in
            "$MENU_RC_QUIT") rc=$MENU_RC_QUIT; break ;;
            "$MENU_RC_BACK") rc=0;             break ;;
        esac
    done
    [[ -z "${OPS_INVOKED_FROM_DISPATCHER:-}" ]] && menu_keepalive
else
    case "$OP" in
        inspect) op_inspect "$@" || rc=$? ;;
        format)  op_format  "$@" || rc=$? ;;
        expiry)  op_expiry  "$@" || rc=$? ;;
        *)       err "unknown op: $OP"; rc=1 ;;
    esac
    (( rc != 0 )) && status="FAIL"
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
