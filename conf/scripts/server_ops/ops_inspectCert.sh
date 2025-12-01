#!/usr/bin/env bash
# Usage:
#   ops_inspectCert.sh /path/to/cert_bundle.[pem|crt|cer|p7b|der] [optional:/path/to/private.key]
# Prints each block’s Subject, Issuer, validity, CA status, and (if key provided) key match.

set -euo pipefail

CERTFILE="${1:-}"
KEYFILE="${2:-}"

if [[ -z "${CERTFILE}" || ! -f "${CERTFILE}" ]]; then
  echo "Usage: $0 /path/to/cert_bundle [optional:/path/to/private.key]" >&2
  exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# Normalize line endings and try to keep as PEM if possible
tr -d '\r' < "$CERTFILE" > "$WORKDIR/src.pem" || true

# If not PEM, convert from PKCS#7 or DER
if ! grep -q "BEGIN CERTIFICATE" "$WORKDIR/src.pem" && ! grep -q "BEGIN TRUSTED CERTIFICATE" "$WORKDIR/src.pem"; then
  TYPE="$(file -b "$CERTFILE" || true)"
  if [[ "$TYPE" == *"PKCS #7"* || "$TYPE" == *"p7b"* ]]; then
    openssl pkcs7 -print_certs -in "$CERTFILE" -out "$WORKDIR/src.pem" >/dev/null 2>&1 || {
      echo "Failed to convert PKCS#7 to PEM." >&2; exit 2; }
  else
    openssl x509 -inform DER -in "$CERTFILE" -out "$WORKDIR/src.pem" >/dev/null 2>&1 || {
      echo "Input isn't readable PEM/DER/PKCS#7." >&2; exit 2; }
  fi
fi

# Split into individual certs
awk -v outdir="$WORKDIR" '
  /BEGIN (TRUSTED )?CERTIFICATE/ {inblk=1; idx++; fn=sprintf("%s/cert_%02d.pem", outdir, idx)}
  inblk {print > fn}
  /END (TRUSTED )?CERTIFICATE/ {inblk=0; close(fn)}
' "$WORKDIR/src.pem"

shopt -s nullglob
CERTS=("$WORKDIR"/cert_*.pem)
COUNT=${#CERTS[@]}
echo "🔍 Found $COUNT certificate block(s) in: $CERTFILE"
echo "------------------------------------------------------------"
if (( COUNT == 0 )); then
  echo "No certificate blocks found."; exit 3
fi

# Optional: compute key fingerprint once
KEYFP=""
if [[ -n "${KEYFILE:-}" && -f "$KEYFILE" ]]; then
  KEYFP="$(openssl pkey -in "$KEYFILE" -pubout -outform pem 2>/dev/null | sha256sum | awk '{print $1}')"
fi

i=0
for f in "${CERTS[@]}"; do
  i=$((i+1))
  SUBJ="$(openssl x509 -in "$f" -noout -subject | sed 's/^subject= *//')"
  ISSR="$(openssl x509 -in "$f" -noout -issuer  | sed 's/^issuer= *//')"
  FROM="$(openssl x509 -in "$f" -noout -startdate | sed 's/^notBefore=//')"
  TO="$(  openssl x509 -in "$f" -noout -enddate   | sed 's/^notAfter=//')"
  if openssl x509 -in "$f" -noout -text | grep -q "CA:TRUE"; then
    TYPE="INTERMEDIATE/ROOT"
    [[ "$SUBJ" == "$ISSR" ]] && TYPE="ROOT (self-signed)" || TYPE="INTERMEDIATE"
  else
    TYPE="LEAF (server cert)"
  fi

  echo "=== cert_$(printf '%02d' "$i").pem ==="
  echo "Subject  : $SUBJ"
  echo "Issuer   : $ISSR"
  echo "Valid From: $FROM"
  echo "Valid To  : $TO"
  echo "Type     : $TYPE"

  if [[ -n "$KEYFP" ]]; then
    CERTFP="$(openssl x509 -in "$f" -noout -pubkey | openssl pkey -pubin -outform pem 2>/dev/null | sha256sum | awk '{print $1}')"
    if [[ -n "$CERTFP" && "$CERTFP" == "$KEYFP" ]]; then
      echo "🔗 Matches provided private key ✅"
    else
      echo "   (does not match provided key)"
    fi
  fi
  echo "------------------------------------------------------------"
done

