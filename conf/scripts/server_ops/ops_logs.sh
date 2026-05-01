#!/bin/bash
#
# ops_logs.sh - Packrat log operations (tail, less, copy, backup)
#
# Replaces: ops_logTail.sh, ops_logLess.sh, ops_logCopy.sh, backup_logs.sh
#
# Usage:
#   ./ops_logs.sh                              # fully interactive
#   ./ops_logs.sh <op>                         # prompt for env
#   ./ops_logs.sh <env> <op> [args...]         # fully non-interactive (cron)
#
# env tokens : 1 | 2 | prod | production | staging | stage | dev
# ops        :
#   tail    [date|latest|today] [--raw]
#   less    [date|latest|today] [--raw]
#   copy    <start-date> <end-date> [dest-dir]   (output: flat .zip)
#   backup  [date] [--format zip|tar.gz]       (default: yesterday, zip)
#
# Log layout (constants near top - adjust if paths change):
#   prod   logs    : $LOG_BASE_PROD/YYYY/MM/PackratLog_YYYY-MM-DD.log
#   staging logs   : $LOG_BASE_DEV/YYYY/MM/PackratLog_YYYY-MM-DD.log
#   daily archives : $LOG_BACKUP_ROOT/YYYY/<EnvName>/PackratLogs_YYYY-MM.{zip|tar.gz}
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_logs.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"
# shellcheck source=lib/log_format.sh
source "$HERE/lib/log_format.sh"

init_traps

# Capture color decision before any pipelines/subshells mask the TTY.
# Honors NO_COLOR (https://no-color.org). Set OPS_USE_COLOR=0|1 to override.
if [[ -z "${OPS_USE_COLOR:-}" ]]; then
    if { [[ -t 1 ]] || [[ -t 2 ]]; } && [[ -z "${NO_COLOR:-}" ]]; then
        OPS_USE_COLOR=1
    else
        OPS_USE_COLOR=0
    fi
fi
export OPS_USE_COLOR

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------

LOG_BASE_PROD="${LOG_BASE_PROD:-/3ddigip01/Packrat/Logs}"
LOG_BASE_DEV="${LOG_BASE_DEV:-/3ddigip01/Packrat/Logs-Dev}"
LOG_BACKUP_ROOT="${LOG_BACKUP_ROOT:-/3ddigip01/Packrat/Backups/Logs}"

# Resolved after env selection
LOG_BASE=""
ENV_DIR_NAME=""     # "Production" | "Staging" - path-segment name for backups

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

apply_env_paths() {
    case "$ENVIRONMENT" in
        prod)    LOG_BASE="$LOG_BASE_PROD"; ENV_DIR_NAME="Production" ;;
        staging) LOG_BASE="$LOG_BASE_DEV";  ENV_DIR_NAME="Staging" ;;
        *) err "apply_env_paths: bad ENVIRONMENT='$ENVIRONMENT'"; return 1 ;;
    esac
}

# YYYY-MM-DD format + date-d parseability
validate_date() {
    local val="$1"
    [[ "$val" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || return 1
    date -d "$val" >/dev/null 2>&1
}

# Print the path of the live log file matching the given hint.
# For tail: we only want the active file (Winston writes here with
# `tailable: true`, so size-rollover keeps the live name stable).
#   hint = "today" | "" | "latest" | YYYY-MM-DD
# Supports both filename prefixes seen in the wild ("PackratLog_", "PackratLog-").
resolve_log_file() {
    local hint="${1:-today}"

    if [[ "$hint" == "latest" ]]; then
        local f
        f=$(get_most_recent_log "$LOG_BASE") || true
        if [[ -z "$f" ]]; then
            err "no .log files under $LOG_BASE"
            return 1
        fi
        printf '%s\n' "$f"
        return 0
    fi

    local target
    if [[ "$hint" == "today" || -z "$hint" ]]; then
        target=$(date +%F)
    else
        target="$hint"
        if ! validate_date "$target"; then
            err "invalid date: '$target' (use YYYY-MM-DD | today | latest)"
            return 1
        fi
    fi

    local y m
    y=$(date -d "$target" +%Y)
    m=$(date -d "$target" +%m)
    local dir="$LOG_BASE/$y/$m"
    local candidate
    for candidate in "$dir/PackratLog_$target.log" "$dir/PackratLog-$target.log"; do
        if [[ -f "$candidate" ]]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done

    err "log not found for $target under $dir"
    return 1
}

# Print every log file for a date, oldest first (rollovers .log.N down to .log).
#
# Winston rolls by size with `tailable: true`. The live file keeps the
# stable name PackratLog_DATE.log; older chunks are renamed
# PackratLog_DATE.log.1 (most recent rollover), .log.2, ... up to maxFiles.
# Higher N = older content, so chronological order is .log.N -> .log.1 -> .log.
resolve_log_files() {
    local hint="${1:-today}"

    if [[ "$hint" == "latest" ]]; then
        local f
        f=$(get_most_recent_log "$LOG_BASE") || true
        if [[ -z "$f" ]]; then
            err "no .log files under $LOG_BASE"
            return 1
        fi
        printf '%s\n' "$f"
        return 0
    fi

    local target
    if [[ "$hint" == "today" || -z "$hint" ]]; then
        target=$(date +%F)
    else
        target="$hint"
        if ! validate_date "$target"; then
            err "invalid date: '$target' (use YYYY-MM-DD | today | latest)"
            return 1
        fi
    fi

    local y m
    y=$(date -d "$target" +%Y)
    m=$(date -d "$target" +%m)
    local dir="$LOG_BASE/$y/$m"
    if [[ ! -d "$dir" ]]; then
        err "log dir not found: $dir"
        return 1
    fi

    shopt -s nullglob
    local f rolled=() live=()
    for f in "$dir"/PackratLog_"$target".log.[0-9]* "$dir"/PackratLog-"$target".log.[0-9]*; do
        [[ -f "$f" ]] && rolled+=("$f")
    done
    for f in "$dir"/PackratLog_"$target".log "$dir"/PackratLog-"$target".log; do
        [[ -f "$f" ]] && live+=("$f")
    done
    shopt -u nullglob

    if (( ${#rolled[@]} == 0 )) && (( ${#live[@]} == 0 )); then
        err "log not found for $target under $dir"
        return 1
    fi

    # Sort rolled files by numeric suffix descending (highest N = oldest).
    local sorted_rolled=()
    if (( ${#rolled[@]} > 0 )); then
        mapfile -t sorted_rolled < <(
            printf '%s\n' "${rolled[@]}" | awk '
                {
                    n = $0
                    sub(/.*\.log\./, "", n)
                    print n "\t" $0
                }
            ' | sort -k1,1 -rn | cut -f2-
        )
    fi

    local out
    for out in "${sorted_rolled[@]}" "${live[@]}"; do
        printf '%s\n' "$out"
    done
}

# ---------------------------------------------------------------------------
# Operation: tail
# ---------------------------------------------------------------------------

op_tail() {
    OPS_CURRENT_OP="tail"
    local raw=0 hint=""
    while (( $# > 0 )); do
        case "$1" in
            --raw) raw=1 ;;
            *)     [[ -z "$hint" ]] && hint="$1" ;;
        esac
        shift
    done
    [[ -z "$hint" ]] && hint="today"

    require_cmd tail || return 127

    local file
    file=$(resolve_log_file "$hint") || return 1

    banner "TAIL LOG ($ENV_LABEL)"
    echo "File: $file"
    echo ""

    if (( raw == 1 )) || ! command -v jq >/dev/null 2>&1; then
        if (( raw == 0 )); then
            warn "jq not installed - falling back to raw output"
        fi
        tail -F -- "$file"
    else
        # Preserve SIGPIPE to exit cleanly when the user Ctrl+Cs.
        tail -F -- "$file" | while IFS= read -r line; do
            process_line "$line"
        done
    fi
}

# ---------------------------------------------------------------------------
# Operation: less
# ---------------------------------------------------------------------------

op_less() {
    OPS_CURRENT_OP="less"
    local raw=0 hint=""
    while (( $# > 0 )); do
        case "$1" in
            --raw) raw=1 ;;
            *)     [[ -z "$hint" ]] && hint="$1" ;;
        esac
        shift
    done

    # Interactive: prompt for date when none was supplied. Cron / scripted
    # callers (no TTY) silently fall through to "today".
    if [[ -z "$hint" ]] && is_tty; then
        local input
        read -r -p "Date (YYYY-MM-DD, blank=today, 'latest'): " input
        hint="${input:-today}"
    fi
    [[ -z "$hint" ]] && hint="today"

    require_cmd less || return 127

    local resolved
    resolved=$(resolve_log_files "$hint") || return 1
    local files=()
    mapfile -t files <<< "$resolved"
    if (( ${#files[@]} == 0 )); then
        err "no logs found for $hint"
        return 1
    fi

    banner "LESS LOG ($ENV_LABEL)"
    echo "Date    : $hint"
    echo "Files   : ${#files[@]} (concatenated oldest -> newest)"
    local f
    for f in "${files[@]}"; do echo "  - $f"; done

    if (( raw == 1 )) || ! command -v jq >/dev/null 2>&1; then
        if (( raw == 0 )); then
            warn "jq not installed - showing raw files"
        fi
        less -R -- "${files[@]}"
    else
        # Pretty-print into less. -R preserves ANSI.
        {
            for f in "${files[@]}"; do
                while IFS= read -r line; do
                    process_line "$line"
                done < "$f"
            done
        } | less -R
    fi
}

# ---------------------------------------------------------------------------
# Operation: copy (archive date range -> flattened tar.gz)
# ---------------------------------------------------------------------------

op_copy() {
    OPS_CURRENT_OP="copy"
    local start_date="${1:-}"
    local end_date="${2:-}"
    local dest_dir="${3:-}"

    banner "COPY LOG RANGE ($ENV_LABEL)"

    if [[ -z "$start_date" ]]; then
        read -r -p "Start date (YYYY-MM-DD, blank=today): " start_date
        [[ -z "$start_date" ]] && start_date=$(date +%F)
    fi
    if [[ -z "$end_date" ]]; then
        read -r -p "End date   (YYYY-MM-DD, blank=today): " end_date
        [[ -z "$end_date" ]] && end_date=$(date +%F)
    fi

    validate_date "$start_date" || { err "invalid start date: $start_date"; return 1; }
    validate_date "$end_date"   || { err "invalid end   date: $end_date";   return 1; }

    if (( $(date -d "$start_date" +%s) > $(date -d "$end_date" +%s) )); then
        err "start date ($start_date) is after end date ($end_date)"
        return 1
    fi

    if [[ -z "$dest_dir" ]]; then
        read -r -p "Destination (blank=$PWD): " dest_dir
        [[ -z "$dest_dir" ]] && dest_dir="$PWD"
    fi
    mkdir -p -- "$dest_dir"
    dest_dir="$(cd "$dest_dir" && pwd -P)"

    require_cmd zip || return 127

    hr
    echo "Root Path  : $LOG_BASE"
    echo "Date Range : $start_date -> $end_date"
    echo "Dest Dir   : $dest_dir"
    hr

    shopt -s nullglob
    local tmp_list
    tmp_list=$(mktemp)
    register_tmp_file "$tmp_list"

    local current="$start_date"
    while :; do
        local y m f
        y=$(date -d "$current" +%Y)
        m=$(date -d "$current" +%m)
        local day_dir="$LOG_BASE/$y/$m"
        if [[ -d "$day_dir" ]]; then
            # Include both the live file AND Winston rollover siblings
            # (.log.1, .log.2, ...). Otherwise high-volume days lose data.
            for f in \
                "$day_dir"/PackratLog_"$current".log \
                "$day_dir"/PackratLog_"$current".log.[0-9]* \
                "$day_dir"/PackratLog-"$current".log \
                "$day_dir"/PackratLog-"$current".log.[0-9]*; do
                [[ -f "$f" ]] || continue
                printf '%s\0' "$f" >> "$tmp_list"
            done
        fi
        [[ "$current" == "$end_date" ]] && break
        current="$(date -I -d "$current + 1 day")"
    done
    shopt -u nullglob

    local file_count
    file_count=$(tr -cd '\0' < "$tmp_list" | wc -c | awk '{print $1}')

    if (( file_count == 0 )); then
        warn "no logs found for $start_date -> $end_date"
        return 2
    fi

    # Basename-collision detection (carried over from ops_logCopy.sh -
    # flattening would silently overwrite if two sources share a name).
    local dupes
    dupes=$(
        while IFS= read -r -d '' f; do basename -- "$f"; done < "$tmp_list" \
        | sort | uniq -d
    )
    if [[ -n "$dupes" ]]; then
        err "duplicate filenames would collide in the flattened archive:"
        echo "$dupes" | sed 's/^/   - /' >&2
        return 3
    fi

    local archive_name tmp_archive
    archive_name="PackratLogs_${ENV_DIR_NAME,,}_${start_date}_to_${end_date}.zip"
    tmp_archive="/tmp/$archive_name"
    register_tmp_file "$tmp_archive"

    # Build file list as an array for `zip -j` (junk paths -> flat archive).
    local zip_files=()
    while IFS= read -r -d '' f; do zip_files+=("$f"); done < "$tmp_list"

    note "found $file_count file(s)"
    note "building archive: $tmp_archive"
    zip -jq "$tmp_archive" "${zip_files[@]}"

    note "moving to: $dest_dir"
    mv -f -- "$tmp_archive" "$dest_dir/"
    chmod 644 -- "$dest_dir/$archive_name"

    echo ""
    echo "Archive : $dest_dir/$archive_name"
    echo "Files   : $file_count"
    echo "Range   : $start_date -> $end_date"
}

# ---------------------------------------------------------------------------
# Operation: backup (daily rollup - cron target)
# ---------------------------------------------------------------------------

op_backup() {
    OPS_CURRENT_OP="backup"
    local date_arg=""
    local format="zip"
    while (( $# > 0 )); do
        case "$1" in
            --format)
                format="${2:-zip}"; shift 2
                continue
                ;;
            --format=*)
                format="${1#--format=}"
                ;;
            *)
                [[ -z "$date_arg" ]] && date_arg="$1"
                ;;
        esac
        shift
    done

    # Default to yesterday (cron target: run shortly after midnight UTC)
    if [[ -z "$date_arg" ]]; then
        date_arg=$(date -u -d "yesterday" +%F)
    fi
    validate_date "$date_arg" || { err "invalid date: $date_arg"; return 1; }

    case "$format" in
        zip|tar.gz) ;;
        *) err "unknown --format: '$format' (use zip | tar.gz)"; return 1 ;;
    esac

    local y m
    y=$(date -d "$date_arg" +%Y)
    m=$(date -d "$date_arg" +%m)
    local src_dir="$LOG_BASE/$y/$m"
    local dst_dir="$LOG_BACKUP_ROOT/$y/$ENV_DIR_NAME"

    # Locate any source log for the date (live + rollover siblings).
    shopt -s nullglob
    local src_files=() candidate
    for candidate in \
        "$src_dir/PackratLog_$date_arg".log \
        "$src_dir/PackratLog_$date_arg".log.[0-9]* \
        "$src_dir/PackratLog-$date_arg".log \
        "$src_dir/PackratLog-$date_arg".log.[0-9]*; do
        [[ -f "$candidate" ]] && src_files+=("$candidate")
    done
    shopt -u nullglob

    banner "BACKUP LOG ($ENV_LABEL / $date_arg)"
    echo "Source  : $src_dir/PackratLog_$date_arg.log{,.N}"
    echo "Dest    : $dst_dir"
    echo "Format  : $format"

    # Exit 0 cleanly with nothing to do - cron should not page on this.
    if (( ${#src_files[@]} == 0 )); then
        echo ""
        note "no log files found for $date_arg (nothing to archive)"
        return 0
    fi

    mkdir -p -- "$dst_dir"

    local date_prefix="$y-$m"
    local archive
    case "$format" in
        zip)    archive="$dst_dir/PackratLogs_${date_prefix}.zip" ;;
        tar.gz) archive="$dst_dir/PackratLogs_${date_prefix}.tar.gz" ;;
    esac
    echo "Archive : $archive"
    echo ""

    # Cron-safe: serialize concurrent invocations on the same archive.
    with_lock "logs-backup-${ENVIRONMENT}-${date_prefix}-${format}" -- \
        __do_backup "$format" "$archive" "" "$src_dir" "$date_arg"
}

# Internals for op_backup. Split so with_lock can invoke as a subcommand.
__do_backup() {
    local format="$1" archive="$2" src_file="$3" src_dir="$4" date_arg="$5"
    case "$format" in
        zip)
            require_cmd zip || return 127
            # Pull every file for this date (live .log + rollover .log.N).
            shopt -s nullglob
            local day_files=() f
            for f in \
                "$src_dir"/PackratLog_"$date_arg".log \
                "$src_dir"/PackratLog_"$date_arg".log.[0-9]* \
                "$src_dir"/PackratLog-"$date_arg".log \
                "$src_dir"/PackratLog-"$date_arg".log.[0-9]*; do
                [[ -f "$f" ]] && day_files+=("$f")
            done
            shopt -u nullglob
            if (( ${#day_files[@]} == 0 )); then
                note "no log files for $date_arg in $src_dir"
                return 0
            fi
            # -u update in place; -q quiet; -j junk paths (flatten).
            if zip -uqj "$archive" "${day_files[@]}"; then
                echo "archived ${#day_files[@]} file(s) for $date_arg -> $(basename "$archive")"
            else
                err "zip failed (rc=$?)"
                return 1
            fi
            ;;
        tar.gz)
            require_cmd tar || return 127
            # tar.gz cannot cleanly append; rebuild the month archive fresh
            # each run. Idempotent. Includes rollover siblings.
            shopt -s nullglob
            local month_files=()
            local f
            for f in \
                "$src_dir"/PackratLog_*.log \
                "$src_dir"/PackratLog_*.log.[0-9]* \
                "$src_dir"/PackratLog-*.log \
                "$src_dir"/PackratLog-*.log.[0-9]*; do
                [[ -f "$f" ]] && month_files+=("$f")
            done
            shopt -u nullglob
            if (( ${#month_files[@]} == 0 )); then
                note "no logs in $src_dir to tar"
                return 0
            fi
            tar -czf "$archive" --transform='s#.*/##' -- "${month_files[@]}"
            echo "archived ${#month_files[@]} file(s) -> $(basename "$archive")"
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    banner "PACKRAT LOG OPS"
    echo "Environment: $ENV_LABEL ($LOG_BASE)"
    echo ""
    echo "[1] Tail     - follow today's log"
    echo "[2] Less     - page through today's log"
    echo "[3] Copy     - archive date range to zip"
    echo "[4] Backup   - daily rollup (default: yesterday)"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1)    run_op op_tail   || return $MENU_RC_QUIT ;;
        2)    run_op op_less   || return $MENU_RC_QUIT ;;
        3)    run_op op_copy   || return $MENU_RC_QUIT ;;
        4)    run_op op_backup || return $MENU_RC_QUIT ;;
        [Bb]) return $MENU_RC_BACK ;;
        [Qq]) return $MENU_RC_QUIT ;;
        *)    err "invalid choice" ;;
    esac
    return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() {
    sed -n '2,25p' "$0"
}

# Handle -h / --help anywhere in the leading args
case "${1:-}" in
    -h|--help) print_help; exit 0 ;;
esac

# If arg 1 is a recognized env token, normalize and consume it.
case "${1:-}" in
    1|2|prod|production|PROD|PRODUCTION|Prod|Production|\
    staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
        normalize_env "$1" >/dev/null
        shift
        ;;
esac

OP="${1:-}"
[[ -n "$OP" ]] && shift

# If env still unset, we need one. Even for a fully-specified op like
# `./ops_logs.sh tail`, env is required.
if [[ -z "${ENVIRONMENT:-}" ]]; then
    select_env_interactive
fi

apply_env_paths

status="OK"
rc=0
if [[ -z "$OP" ]]; then
    # Interactive menu loop. Initial clear; subsequent iterations leave
    # op output visible so operators can scroll back to it.
    menu_clear
    while :; do
        main_menu
        menu_rc=$?
        case "$menu_rc" in
            "$MENU_RC_QUIT") rc=$MENU_RC_QUIT; break ;;
            "$MENU_RC_BACK") rc=0;             break ;;
        esac
    done
    # Park unless the dispatcher will (it parks at its own exit).
    [[ -z "${OPS_INVOKED_FROM_DISPATCHER:-}" ]] && menu_keepalive
else
    case "$OP" in
        tail)   op_tail   "$@" || rc=$? ;;
        less)   op_less   "$@" || rc=$? ;;
        copy)   op_copy   "$@" || rc=$? ;;
        backup) op_backup "$@" || rc=$? ;;
        *)      err "unknown op: $OP"; rc=1 ;;
    esac
    (( rc != 0 )) && status="FAIL"
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
