#!/bin/bash
#
# lib/log_format.sh - pretty-print Packrat JSON log lines
#
# Sourced by ops_logs.sh (tail, less, copy).
# Depends on lib/common.sh (for is_tty()).
#
# Public API:
#   colorize_level crit|error|warn|info|debug|perf
#   dim_data "text"
#   strip_ansi "text"
#   process_line "json-line"     (honors --raw / PROCESS_LINE_RAW=1)
#   get_most_recent_log /dir
#
# ANSI sequences are skipped entirely when stdout is not a TTY,
# which keeps cron output / redirected files clean.
#
# --raw mode (or missing jq) falls back to emitting the original line
# verbatim, so operators never lose visibility because jq is missing.
#

if [[ -n "${__PACKRAT_LIB_LOG_FORMAT_SOURCED:-}" ]]; then
    return 0
fi
__PACKRAT_LIB_LOG_FORMAT_SOURCED=1

# ---------------------------------------------------------------------------
# ANSI helpers
# ---------------------------------------------------------------------------

colorize_level() {
    local level="$1"
    if ! is_tty; then
        printf '%s' "$level"
        return 0
    fi
    case "$level" in
        crit)   printf '\033[1;35m%s\033[0m' "$level" ;;   # bold magenta
        error)  printf '\033[1;31m%s\033[0m' "$level" ;;   # bold red
        warn)   printf '\033[1;33m%s\033[0m' "$level" ;;   # bold yellow
        info)   printf '\033[36m%s\033[0m'   "$level" ;;   # cyan
        debug)  printf '\033[90m%s\033[0m'   "$level" ;;   # gray
        perf)   printf '\033[32m%s\033[0m'   "$level" ;;   # green
        *)      printf '%s' "$level" ;;
    esac
}

dim_data() {
    local data="$1"
    if ! is_tty; then
        printf '%s' "$data"
        return 0
    fi
    printf '\033[90m%s\033[0m' "$data"
}

strip_ansi() {
    # shellcheck disable=SC2001
    echo "$1" | sed 's/\x1b\[[0-9;]*m//g'
}

# ---------------------------------------------------------------------------
# process_line - format one JSON log line
# ---------------------------------------------------------------------------

process_line() {
    local raw=0
    if [[ "${1:-}" == "--raw" ]]; then
        raw=1
        shift
    fi
    if [[ "${PROCESS_LINE_RAW:-0}" == "1" ]]; then
        raw=1
    fi

    local line="${1:-}"
    if [[ -z "$line" ]]; then
        return 0
    fi

    # Fallback path: raw requested OR jq is not installed. Emit verbatim.
    if (( raw == 1 )) || ! command -v jq >/dev/null 2>&1; then
        printf '%s\n' "$line"
        return 0
    fi

    local timestamp requestId userId section level message caller data
    timestamp=$(echo "$line" | jq -r '.timestamp // ""'                     2>/dev/null)
    # Defaults are -1 so missing fields take the same dashes branch
    # below as an explicit -1 (matches the server's customConsoleFormat).
    requestId=$(echo "$line" | jq -r '.context.idRequest // -1'             2>/dev/null)
    userId=$(echo "$line"    | jq -r '.context.idUser   // -1'              2>/dev/null)
    section=$(echo "$line"   | jq -r '.context.section  // "-----"'         2>/dev/null)
    level=$(echo "$line"     | jq -r '(.level // "") | ascii_downcase'       2>/dev/null)
    message=$(echo "$line"   | jq -r '.message // ""'                       2>/dev/null)
    caller=$(echo "$line"    | jq -r '.context.caller // ""'                2>/dev/null)
    data=$(echo "$line"      | jq -c 'if .data then .data else empty end'   2>/dev/null)

    # If the line wasn't parseable JSON, jq returned empty for all of these.
    # Fall back to raw output so the operator can still see the line.
    if [[ -z "$timestamp" && -z "$level" && -z "$message" ]]; then
        printf '%s\n' "$line"
        return 0
    fi

    # Single-letter prefix tokens (5 chars wide), matching the server's
    # customConsoleFormat (server/records/logger/log.ts):
    #   R0042 - request 42        U0007 - user 7
    #   X---- - no request        U---- - no user
    # X (rather than R----) makes "no session" trivially greppable.
    if [[ "$requestId" =~ ^[0-9]+$ ]]; then
        requestId=$(printf "R%04d" "$requestId")
    else
        requestId="X----"
    fi

    if [[ "$userId" =~ ^[0-9]+$ ]]; then
        userId=$(printf "U%04d" "$userId")
    else
        userId="U----"
    fi

    # Section: right-align in 5 chars (matches server padStart(5)).
    section=$(printf "%5s" "$section")

    local colored_level raw_level level_pad
    colored_level=$(colorize_level "$level")
    raw_level=$(strip_ansi "$colored_level")
    # Level pad: right-align level in 6 chars (matches server padStart(6)).
    if (( ${#raw_level} < 6 )); then
        level_pad=$(printf "%*s" $((6 - ${#raw_level})) "")
    else
        level_pad=""
    fi

    if [[ -n "$data" ]]; then
        local clean_data
        clean_data=$(echo "$data" | sed 's/\\n/ /g; s/\\t/ /g; s/\\"/"/g')
        local max_length=160
        if (( ${#clean_data} > max_length )); then
            local short_data
            short_data=$(echo "$clean_data" | cut -c1-$max_length)
            data=$(dim_data "($short_data...)")
        else
            data=$(dim_data "($clean_data)")
        fi
    else
        data=""
    fi

    # ISO timestamp → "YYYY-MM-DD HH:MM:SS"
    timestamp=$(echo "$timestamp" | sed -e 's/T/ /' -e 's/\..*//')

    # Caller: omit the brackets entirely when there is no caller (matches server).
    local caller_part=""
    if [[ -n "$caller" ]]; then
        caller_part="[${caller}] "
    fi

    echo -e "${timestamp} ${requestId} ${userId} ${section} ${level_pad}${colored_level}: ${caller_part}${message} ${data}"
}

# ---------------------------------------------------------------------------
# get_most_recent_log - newest *.log under a directory
# ---------------------------------------------------------------------------

get_most_recent_log() {
    local log_root="$1"
    [[ -d "$log_root" ]] || return 1
    find "$log_root" -type f -name "*.log" 2>/dev/null | sort | tail -n 1
}
