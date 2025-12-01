#!/usr/bin/env bash
# Usage:
#   ops_formatCert.sh /path/to/cert_bundle.[pem|crt|cer|p7b|der]
# Behavior:
#   - Requires exactly 4 blocks (root + 2 intermed + leaf) or exits with error
#   - Identifies leaf (CA:FALSE), intermediates (CA:TRUE not self-signed), root (CA:TRUE self-signed)
#   - Creates timestamped backup of the original
#   - Rewrites the original file to: LEAF + INTERMEDIATE(S) (root omitted)

set -euo pipefail

CERTFILE="${1:-}"
if [[ -z "$CERTFILE" || ! -f "$CERTFILE" ]]; then
  echo "Usage: $0 /path/to/cert_bundle" >&2
  exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# Normalize and convert to PEM if needed
tr -d '\r' < "$CERTFILE" > "$WORKDIR/src.pem" || true
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

# Split into blocks
awk -v outdir="$WORKDIR" '
  /BEGIN (TRUSTED )?CERTIFICATE/ {inblk=1; idx++; fn=sprintf("%s/cert_%02d.pem", outdir, idx)}
  inblk {print > fn}
  /END (TRUSTED )?CERTIFICATE/ {inblk=0; close(fn)}
' "$WORKDIR/src.pem"

shopt -s nullglob
CERTS=("$WORKDIR"/cert_*.pem)
COUNT=${#CERTS[@]}
echo "Found $COUNT block(s)."
if (( COUNT != 4 )); then
  echo "❌ Expected exactly 4 certificate blocks. Aborting."
  exit 3
fi

subj()  { openssl x509 -in "$1" -noout -subject 2>/dev/null | sed 's/^subject= *//'; }
issr()  { openssl x509 -in "$1" -noout -issuer  2>/dev/null | sed 's/^issuer= *//'; }
is_ca() { openssl x509 -in "$1" -noout -text 2>/dev/null | grep -q "CA:TRUE"; }
self()  { [[ "$(subj "$1")" == "$(issr "$1")" ]]; }

leaf=""
root=""
interms=()
for f in "${CERTS[@]}"; do
  if is_ca "$f"; then
    if self "$f"; then root="$f"; else interms+=("$f"); fi
  else
    leaf="$f"
  fi
done

if [[ -z "$leaf" ]]; then
  echo "❌ Could not identify a LEAF (server) certificate. Aborting."
  exit 4
fi

# Order intermediates by chaining issuer→subject
current="$(issr "$leaf")"
ordered=()
remaining=("${interms[@]}")
while (( ${#remaining[@]} )); do
  found=0
  for i in "${!remaining[@]}"; do
    f="${remaining[$i]}"
    if [[ "$(subj "$f")" == "$current" ]]; then
      ordered+=("$f")
      current="$(issr "$f")"
      unset 'remaining[i]'
      remaining=("${remaining[@]}")
      found=1
      break
    fi
  done
  (( found == 0 )) && break
done
# Append leftovers (if any)
if (( ${#remaining[@]} )); then
  ordered+=("${remaining[@]}")
fi

# Backup and rewrite: LEAF + INTERMEDIATES (omit root)
TS="$(date +%Y%m%d%H%M%S)"
BACKUP="${CERTFILE}.bak.${TS}"
cp -p "$CERTFILE" "$BACKUP"
echo "📦 Backup saved: $BACKUP"

{
  cat "$leaf"
  for im in "${ordered[@]}"; do cat "$im"; done
} > "$CERTFILE"

echo "✅ Rewrote $CERTFILE as: LEAF + INTERMEDIATE(S) (root omitted)"
echo "Order written:"
echo " - $(subj "$leaf")"
for im in "${ordered[@]}"; do
  echo " - $(subj "$im")"
done

