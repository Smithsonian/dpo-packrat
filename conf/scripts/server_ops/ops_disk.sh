#!/bin/bash
#
# ops_disk.sh - Packrat disk operations (usage, watch, cleanup, monitor)
#
# Replaces: ops_disk.sh, ops_diskUsage.sh, ops_diskCleanup.sh, ops_monitorDisk.sh
#
# Usage:
#   ./ops_disk.sh                                 # fully interactive
#   ./ops_disk.sh <op> [args...]                  # non-interactive
#
# Operations:
#   usage   [folder] [--path a,b,c]               # one-shot df + optional du
#   watch   [folder] [--interval N] [--path ...]  # real-time loop (default 10s)
#   cleanup <path> [--dry-run] [--ignore-recent] [--yes]
#                                                 # release deleted-file FDs
#                                                 # --ignore-recent skips files
#                                                 # modified in last 2 days
#   monitor <path>                                # inotify event stream
#
# Disk ops are path-keyed, not env-keyed, so no env prompt is shown.
#
# Dependencies (checked per-op):
#   usage/watch : df, du
#   cleanup     : lsof, awk, stat, truncate
#   monitor     : inotifywait   (sudo apt-get install inotify-tools)
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_disk.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"

init_traps

# ---------------------------------------------------------------------------
# Defaults (top of file - adjust if Packrat volumes change)
# ---------------------------------------------------------------------------

DEFAULT_MONITOR_FS=("/data" "/staging")
DEFAULT_MONITOR_DIRS=("/staging/Packrat/Storage-Dev/tmp" "/data/Packrat/Temp/docker/overlay2")

# ---------------------------------------------------------------------------
# Shared rendering helpers
# ---------------------------------------------------------------------------

# Print a header row for the usage table
print_usage_header() {
    printf "%-18s %-10s %-10s %-8s\n" "Filesystem" "Used" "Available" "% Used"
    echo "---------------------------------------------"
}

# Emit one usage line per path in the provided array.
#   $@ = list of filesystem paths
render_fs_usage() {
    local fs
    for fs in "$@"; do
        if df -h -- "$fs" >/dev/null 2>&1; then
            df -h -- "$fs" | awk -v p="$fs" 'NR==2 {printf "%-18s %-10s %-10s %-8s\n", p, $3, $4, $5}'
        else
            printf "%-18s %s\n" "$fs" "(not available)"
        fi
    done
}

# If a folder was provided, print its du -sh line.
render_folder_usage() {
    local folder="$1"
    [[ -z "$folder" ]] && return 0
    if [[ ! -d "$folder" ]]; then
        echo ""
        warn "folder '$folder' does not exist or is not accessible"
        return 0
    fi
    local size
    size=$(du -sh -- "$folder" 2>/dev/null | awk '{print $1}')
    echo ""
    printf "Folder: %-40s %s\n" "$folder" "${size:-?}"
}

# ---------------------------------------------------------------------------
# Operation: usage
# ---------------------------------------------------------------------------

op_usage() {
    OPS_CURRENT_OP="usage"
    local folder=""
    local -a paths=("${DEFAULT_MONITOR_FS[@]}")

    while (( $# > 0 )); do
        case "$1" in
            --path)
                IFS=',' read -r -a paths <<< "${2:-}"
                shift 2
                continue
                ;;
            --path=*)
                IFS=',' read -r -a paths <<< "${1#--path=}"
                ;;
            -h|--help)
                echo "usage: ops_disk.sh usage [folder] [--path /a,/b]"
                return 0
                ;;
            *)
                [[ -z "$folder" ]] && folder="$1"
                ;;
        esac
        shift
    done

    require_cmd df || return 127

    banner "DISK USAGE"
    print_usage_header
    render_fs_usage "${paths[@]}"

    if [[ -n "$folder" ]]; then
        require_cmd du || return 127
        render_folder_usage "$folder"
    fi

    echo ""
    echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
}

# ---------------------------------------------------------------------------
# Operation: watch
# ---------------------------------------------------------------------------

op_watch() {
    OPS_CURRENT_OP="watch"
    local folder=""
    local interval=10
    local -a paths=("${DEFAULT_MONITOR_FS[@]}")

    while (( $# > 0 )); do
        case "$1" in
            --interval)   interval="${2:-10}"; shift 2; continue ;;
            --interval=*) interval="${1#--interval=}" ;;
            --path)
                IFS=',' read -r -a paths <<< "${2:-}"
                shift 2
                continue
                ;;
            --path=*)
                IFS=',' read -r -a paths <<< "${1#--path=}"
                ;;
            -h|--help)
                echo "usage: ops_disk.sh watch [folder] [--interval N] [--path /a,/b]"
                return 0
                ;;
            *)
                [[ -z "$folder" ]] && folder="$1"
                ;;
        esac
        shift
    done

    if ! [[ "$interval" =~ ^[0-9]+$ ]] || (( interval < 1 )); then
        err "--interval must be a positive integer"
        return 1
    fi

    require_cmd df || return 127
    [[ -n "$folder" ]] && { require_cmd du || return 127; }

    # Initial blank frame. We redraw in place; scrollback above is preserved.
    echo ""
    while :; do
        # Cursor to home; frame; clear-to-end-of-screen.
        printf '\033[H'
        banner "DISK USAGE (watch - interval ${interval}s, Ctrl+C to stop)"
        print_usage_header
        render_fs_usage "${paths[@]}"
        render_folder_usage "$folder"
        echo ""
        echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
        printf '\033[J'
        sleep "$interval"
    done
}

# ---------------------------------------------------------------------------
# Operation: cleanup (release deleted-file FDs)
# ---------------------------------------------------------------------------
#
# On Linux, when a process holds an open FD to a deleted file, the blocks
# are not reclaimed until the process closes the FD (or exits). Writing
# zero bytes into /proc/<pid>/fd/<fd> (via truncate) forces the kernel
# to release those blocks without killing the process - useful when a
# long-lived app has rotated its log and still holds the old file open.

op_cleanup() {
    OPS_CURRENT_OP="cleanup"
    local path_prefix=""
    local dry_run=false
    local ignore_recent=false
    local assume_yes=false

    while (( $# > 0 )); do
        case "$1" in
            --dry-run)        dry_run=true ;;
            --ignore-recent)  ignore_recent=true ;;
            --yes|-y)         assume_yes=true ;;
            -h|--help)
                echo "usage: ops_disk.sh cleanup <path> [--dry-run] [--ignore-recent] [--yes]"
                return 0
                ;;
            *)
                [[ -z "$path_prefix" ]] && path_prefix="$1"
                ;;
        esac
        shift
    done

    if [[ -z "$path_prefix" ]]; then
        err "cleanup requires <path>"
        echo "usage: ops_disk.sh cleanup <path> [--dry-run] [--ignore-recent] [--yes]" >&2
        return 1
    fi

    require_cmd lsof awk stat truncate || return 127

    banner "DISK CLEANUP ($path_prefix)"
    if $dry_run;       then echo "Mode         : DRY RUN (listing only)"; fi
    if $ignore_recent; then echo "Age filter   : skip files modified <2d ago"; fi
    echo "Path prefix  : $path_prefix"
    echo ""

    # Cron-safe serialization. Two concurrent cleanups racing on the same
    # prefix would just duplicate work - with_lock makes the second invocation
    # exit 75 instead.
    local lock_key
    lock_key="disk-cleanup-$(echo -n "$path_prefix" | tr -c 'A-Za-z0-9' '-')"
    with_lock "$lock_key" -- __cleanup_run \
        "$path_prefix" "$dry_run" "$ignore_recent" "$assume_yes"
}

# Internals for op_cleanup (so with_lock can call us as a subcommand).
__cleanup_run() {
    local path_prefix="$1"
    local dry_run="$2"
    local ignore_recent="$3"
    local assume_yes="$4"
    local now_epoch
    now_epoch=$(date +%s)

    # First pass: dry-list. If apply mode + not --yes + not TTY, bail out.
    local plan
    plan=$(__cleanup_scan "$path_prefix" "$ignore_recent" "$now_epoch")

    if [[ -z "$plan" ]]; then
        echo "No deleted files matching prefix '$path_prefix' are open."
        return 0
    fi

    echo "$plan"
    echo ""

    if [[ "$dry_run" == "true" ]]; then
        return 0
    fi

    # Confirmation gate when running in apply mode
    if [[ "$assume_yes" != "true" ]]; then
        if ! [[ -t 0 ]]; then
            err "not a TTY and --yes not given; refusing to truncate"
            return 1
        fi
        if ! confirm "Release the FDs listed above?"; then
            echo "Cancelled."
            return 1
        fi
    fi

    # Second pass: truncate each matching FD.
    __cleanup_apply "$path_prefix" "$ignore_recent" "$now_epoch"
}

# Pretty-list without truncating. Returns plan text on stdout.
__cleanup_scan() {
    local path_prefix="$1"
    local ignore_recent="$2"
    local now_epoch="$3"
    lsof -nP -F pufsn +L1 2>/dev/null | awk \
        -v prefix="$path_prefix" \
        -v recent="$ignore_recent" \
        -v now_time="$now_epoch" '
        BEGIN { pid=""; fd=""; size=""; name=""; total_files=0; total_size=0 }
        /^p/ { pid = substr($0, 2) }
        /^f/ { fd  = substr($0, 2) }
        /^u/ { }
        /^s/ { size = substr($0, 2) }
        /^n/ {
            name = substr($0, 2)
            if (name ~ /\(deleted\)$/ && name ~ "^"prefix) {
                gsub(/ \(deleted\)$/, "", name)

                if (recent == "true") {
                    cmd = "stat -Lc %Y /proc/" pid "/fd/" fd " 2>/dev/null"
                    cmd | getline mod_time
                    close(cmd)
                    age_days = int((now_time - mod_time) / 86400)
                    if (age_days < 2) {
                        printf "[skip ] recent file (age %dd): %s (pid=%s fd=%s)\n", age_days, name, pid, fd
                        next
                    }
                }

                printf "[plan ] %s (pid=%s fd=%s size=%s)\n", name, pid, fd, size
                total_files++
                total_size += size
            }
        }
        END {
            split("B KB MB GB TB", units)
            s = total_size
            for (u = 1; s >= 1024 && u < 5; u++) s /= 1024
            hr = sprintf("%.2f %s", s, units[u])
            printf "\n---\nMatching files: %d\nReleasable     : %s\n", total_files, hr
        }'
}

# Truncate each FD we decided to act on.
__cleanup_apply() {
    local path_prefix="$1"
    local ignore_recent="$2"
    local now_epoch="$3"
    lsof -nP -F pufsn +L1 2>/dev/null | awk \
        -v prefix="$path_prefix" \
        -v recent="$ignore_recent" \
        -v now_time="$now_epoch" '
        BEGIN { pid=""; fd=""; size=""; name=""; released=0; total_size=0 }
        /^p/ { pid = substr($0, 2) }
        /^f/ { fd  = substr($0, 2) }
        /^u/ { }
        /^s/ { size = substr($0, 2) }
        /^n/ {
            name = substr($0, 2)
            if (name ~ /\(deleted\)$/ && name ~ "^"prefix) {
                gsub(/ \(deleted\)$/, "", name)
                if (recent == "true") {
                    cmd = "stat -Lc %Y /proc/" pid "/fd/" fd " 2>/dev/null"
                    cmd | getline mod_time
                    close(cmd)
                    age_days = int((now_time - mod_time) / 86400)
                    if (age_days < 2) next
                }
                cmd = "truncate -s 0 /proc/" pid "/fd/" fd " 2>/dev/null || : > /proc/" pid "/fd/" fd " 2>/dev/null"
                system(cmd)
                printf "[done ] %s (pid=%s fd=%s)\n", name, pid, fd
                released++
                total_size += size
            }
        }
        END {
            split("B KB MB GB TB", units)
            s = total_size
            for (u = 1; s >= 1024 && u < 5; u++) s /= 1024
            hr = sprintf("%.2f %s", s, units[u])
            printf "\n---\nReleased: %d file(s)\nReclaimed: %s\n", released, hr
        }'
}

# ---------------------------------------------------------------------------
# Operation: monitor (inotify event stream)
# ---------------------------------------------------------------------------

op_monitor() {
    OPS_CURRENT_OP="monitor"
    local target="${1:-}"

    if [[ -z "$target" ]]; then
        err "monitor requires <path>"
        echo "usage: ops_disk.sh monitor <path>" >&2
        return 1
    fi
    if [[ ! -d "$target" ]]; then
        err "not a directory: $target"
        return 1
    fi

    if ! command -v inotifywait >/dev/null 2>&1; then
        err "inotifywait is not installed"
        err "install with: sudo apt-get install inotify-tools"
        return 127
    fi

    banner "DISK MONITOR ($target)"
    echo "Watching recursively for create/delete events. Ctrl+C to stop."
    echo ""

    # inotifywait's own --timefmt handles timestamps, so the old background
    # 'divider' subshell (which could leak on unclean exit) is gone.
    inotifywait -r -m -e create -e delete \
        --format '%T %w%f %e' \
        --timefmt '%Y-%m-%d %H:%M:%S' \
        -- "$target" | while IFS= read -r line; do
        echo "$line"
    done
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    banner "PACKRAT DISK OPS"
    echo "[1] Usage    - one-shot df + optional du"
    echo "[2] Watch    - real-time df loop"
    echo "[3] Cleanup  - release deleted-file FDs"
    echo "[4] Monitor  - inotify event stream"
    echo "[Q] Quit"
    echo ""
    local c arg
    read -r -p "Choose: " c
    case "$c" in
        1)
            read -r -p "Folder to include (blank to skip): " arg
            op_usage "$arg"
            ;;
        2)
            read -r -p "Folder to include (blank to skip): " arg
            op_watch "$arg"
            ;;
        3)
            read -r -p "Path prefix (e.g. /staging): " arg
            op_cleanup "$arg"
            ;;
        4)
            read -r -p "Directory to monitor: " arg
            op_monitor "$arg"
            ;;
        [Qq]) exit 0 ;;
        *) err "invalid choice"; return 1 ;;
    esac
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() {
    sed -n '2,30p' "$0"
}

case "${1:-}" in
    -h|--help) print_help; exit 0 ;;
esac

OP="${1:-}"
[[ -n "$OP" ]] && shift

status="OK"
rc=0
if [[ -z "$OP" ]]; then
    main_menu || rc=$?
else
    case "$OP" in
        usage)   op_usage   "$@" || rc=$? ;;
        watch)   op_watch   "$@" || rc=$? ;;
        cleanup) op_cleanup "$@" || rc=$? ;;
        monitor) op_monitor "$@" || rc=$? ;;
        *)       err "unknown op: $OP"; rc=1 ;;
    esac
fi

(( rc != 0 )) && status="FAIL"
print_summary "$status"
exit $rc
