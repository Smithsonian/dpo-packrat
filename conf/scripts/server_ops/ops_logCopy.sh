#!/usr/bin/env bash
set -euo pipefail

LOG_BASE_PROD="/3ddigip01/Packrat/Logs"
LOG_BASE_DEV="/3ddigip01/Packrat/Logs-Dev"

# ───────────────────────────── helpers ─────────────────────────────
hr()   { printf '%*s\n' "${COLUMNS:-60}" '' | tr ' ' '─'; }
err()  { echo "❌ $*" >&2; }
note() { echo "• $*"; }

header() {
  clear 2>/dev/null || true
  hr
  echo "PACKRAT • LOG COPY"
  hr
}

summary() {
  hr
  echo "Summary"
  hr
  printf " Environment : %s\n" "$ENV_NAME"
  printf " Root Path   : %s\n" "$BASE_PATH"
  printf " Date Range  : %s → %s\n" "$START_DATE" "$END_DATE"
  printf " Files Found : %s\n" "$FILE_COUNT"
  printf " Archive     : %s\n" "$DEST_DIR/$ARCHIVE_NAME"
  hr
}

read_env() {
  echo "Select environment:"
  echo "  [1] Production"
  echo "  [2] Staging"
  read -rp "Choose [1-2]: " env_choice
  case "${env_choice:-}" in
    1) BASE_PATH="$LOG_BASE_PROD"; ENV_NAME="production" ;;
    2) BASE_PATH="$LOG_BASE_DEV";  ENV_NAME="staging" ;;
    *) err "Invalid choice"; exit 1 ;;
  esac
  echo
}

# Accepts empty -> today
read_date() {
  local prompt="$1"
  local outvar="$2"
  local val
  read -rp "$prompt (today): " val
  if [[ -z "${val:-}" ]]; then
    val="$(date +%F)"
  fi
  if [[ ! "$val" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    err "Invalid date format: $val"; exit 1
  fi
  if ! date -d "$val" >/dev/null 2>&1; then
    err "Invalid date value: $val"; exit 1
  fi
  printf -v "$outvar" "%s" "$val"
}

read_dest() {
  local d
  echo ""
  read -rp "Destination (current folder): " d
  if [[ -z "${d:-}" ]]; then d="$PWD"; fi
  mkdir -p -- "$d"
  DEST_DIR="$(cd "$d" && pwd -P)"
  echo
}

# ───────────────────────────── main ─────────────────────────────
main() {
  header
  read_env
  
  echo ""
  echo "Enter Date Range (YYYY-MM-DD)"
  read_date "Start date" START_DATE
  read_date "End date"   END_DATE

  # Ensure START <= END
  if [[ "$(date -d "$START_DATE" +%s)" -gt "$(date -d "$END_DATE" +%s)" ]]; then
    err "Start date ($START_DATE) is after end date ($END_DATE)."
    exit 1
  fi
  echo

  read_dest

  hr
  echo "Collecting logs"
  hr
  printf " Root Path  : %s\n" "$BASE_PATH"
  printf " Date Range : %s → %s\n" "$START_DATE" "$END_DATE"
  echo

  shopt -s nullglob
  TMP_LIST="$(mktemp)"
  : > "$TMP_LIST"

  current="$START_DATE"
  while : ; do
    y=$(date -d "$current" +%Y)
    m=$(date -d "$current" +%m)
    d="$current"

    day_dir="$BASE_PATH/$y/$m"
    if [[ -d "$day_dir" ]]; then
      # Support both prefixes: "PackratLog_" and "PackratLog-"
      for f in "$day_dir"/PackratLog_*"$d"*.log "$day_dir"/PackratLog-"$d"*.log ; do
        [[ -f "$f" ]] || continue
        printf "%s\0" "$f" >> "$TMP_LIST"
      done
    fi

    [[ "$current" == "$END_DATE" ]] && break
    current="$(date -I -d "$current + 1 day")"
  done

  # Count matched files (null-terminated)
  FILE_COUNT="$(tr -cd '\0' < "$TMP_LIST" | wc -c | awk '{print $1}')"

  if [[ "$FILE_COUNT" -eq 0 ]]; then
    rm -f -- "$TMP_LIST"
    err "No logs found for the specified range."
    exit 2
  fi

  ARCHIVE_NAME="PackratLogs_${ENV_NAME}_${START_DATE}_to_${END_DATE}.tar.gz"
  TMP_ARCHIVE="/tmp/$ARCHIVE_NAME"

  # Optional safety: detect basename collisions before flattening
  DUPES="$(
    while IFS= read -r -d '' f; do basename -- "$f"; done < "$TMP_LIST" \
    | sort | uniq -d
  )"
  if [[ -n "$DUPES" ]]; then
    echo "⚠ Detected duplicate filenames that would collide when flattened:"
    echo "$DUPES" | sed 's/^/   - /'
    echo "Aborting to avoid overwriting files in the archive."
    rm -f -- "$TMP_LIST"
    exit 3
  fi

  note "Found $FILE_COUNT file(s)."
  note "Creating archive (flattened): $TMP_ARCHIVE"
  # Flatten paths inside the archive: strip everything up to the last '/'
  tar --null --files-from="$TMP_LIST" -czf "$TMP_ARCHIVE" \
      --transform='s#.*/##'
  rm -f -- "$TMP_LIST"

  note "Moving archive to: $DEST_DIR"
  mv -f -- "$TMP_ARCHIVE" "$DEST_DIR"/

  note "Adjusting permissions to 777"
  chmod 777 -- "$DEST_DIR/$ARCHIVE_NAME"

  echo
  echo "✅ Completed."
  summary
}

main "$@"

