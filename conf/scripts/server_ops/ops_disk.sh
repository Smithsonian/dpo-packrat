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
#   usage      [folder...] [--path a,b,c] [--no-folders]
#                                                 # df over filesystems
#                                                 # + du over default + extra dirs
#   disk-watch [folder...] [--interval N] [--path ...] [--no-folders]
#                                                 # real-time loop (default 10s)
#                                                 # df+du only - for the full
#                                                 # CPU/mem/net/disk dashboard
#                                                 # use ops_system.sh monitor
#   release-deleted <path> [--dry-run] [--ignore-recent] [--yes]
#                                                 # release blocks held by deleted-
#                                                 # but-still-open files (truncate
#                                                 # /proc/<pid>/fd/<fd>). Does NOT
#                                                 # remove anything from the FS.
#                                                 # --ignore-recent skips files
#                                                 # modified in last 2 days
#   monitor    <path> [--events e1,e2,...]        # inotify event stream
#                                                 # default: create,delete,modify,move
#
# Disk ops are path-keyed, not env-keyed, so no env prompt is shown.
#
# Dependencies (checked per-op):
#   usage/watch : df, du, timeout
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

# Filesystems checked with `df` (capacity / % used).
DEFAULT_MONITOR_FS=("/data" "/staging" "/3ddigip01")

# Folders shown via parallel `du` (tree size, NOT filesystem capacity).
# Both prod and staging Repository roots are listed; nonexistent paths are
# silently skipped at render time, so each host shows only its own.
DEFAULT_MONITOR_DIRS=(
    "/3ddigip01/Packrat/Logs"
    "/3ddigip01/Packrat/Backups"
    "/3ddigip01/Packrat/Storage/Repository"
    "/3ddigip01/Packrat/Storage-Dev/Repository"
)

# Wall-clock cap on a single folder size lookup. Repositories with many
# small OCFL objects can take ~tens of seconds to walk over NFS even with
# parallelism.
DU_TIMEOUT_S="${DU_TIMEOUT_S:-90}"

# Parallelism for the per-folder du. Tuned for NFS - too high and the
# server starts queuing requests; too low and we lose the speedup.
DU_PARALLELISM="${DU_PARALLELISM:-8}"

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

# Sum the apparent size of $1 by fanning du across its top-level entries
# in parallel. Falls back to serial `du -sh` when xargs is unavailable.
# Echoes a human-readable size on stdout (or "(timeout)" / "(empty)").
fast_folder_size() {
    local folder="$1"
    local timeout_s="${2:-$DU_TIMEOUT_S}"
    local parallel="${3:-$DU_PARALLELISM}"

    if ! command -v xargs >/dev/null 2>&1 || ! command -v numfmt >/dev/null 2>&1; then
        local size
        size=$(timeout "$timeout_s" du -sh -- "$folder" 2>/dev/null | awk '{print $1}')
        [[ -z "$size" ]] && size="(timeout)"
        printf '%s' "$size"
        return
    fi

    local total
    total=$(timeout "$timeout_s" bash -c '
        folder="$1"
        parallel="$2"
        # Sum direct children + the entries directly under $folder. Hidden
        # dotfiles are picked up because find does not exclude them.
        {
            find "$folder" -mindepth 1 -maxdepth 1 -print0 2>/dev/null \
                | xargs -0 -r -P "$parallel" -n 32 du -sb 2>/dev/null \
                | awk "{sum+=\$1} END {print sum+0}"
        }
    ' _ "$folder" "$parallel" 2>/dev/null)

    if [[ -z "$total" ]]; then
        printf '(timeout)'
        return
    fi
    if [[ "$total" == "0" ]]; then
        printf '(empty)'
        return
    fi
    numfmt --to=iec --suffix=B --format='%.1f' "$total" 2>/dev/null \
        || printf '%s B' "$total"
}

# Print one size line per folder. Nonexistent folders are skipped silently
# so the default list can carry both prod + staging paths.
render_folder_usage() {
    local folder size
    for folder in "$@"; do
        [[ -z "$folder" ]] && continue
        [[ -d "$folder" ]] || continue
        size=$(fast_folder_size "$folder")
        printf "Folder: %-44s %s\n" "$folder" "$size"
    done
}

# ---------------------------------------------------------------------------
# Operation: usage
# ---------------------------------------------------------------------------

op_usage() {
    OPS_CURRENT_OP="usage"
    local -a paths=("${DEFAULT_MONITOR_FS[@]}")
    local -a extra_folders=()
    local include_default_folders=true

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
            --no-folders)
                include_default_folders=false
                ;;
            -h|--help)
                echo "usage: ops_disk.sh usage [folder...] [--path /a,/b] [--no-folders]"
                return 0
                ;;
            *)
                extra_folders+=("$1")
                ;;
        esac
        shift
    done

    require_cmd df || return 127

    banner "DISK USAGE"
    print_usage_header
    render_fs_usage "${paths[@]}"

    local -a folders=()
    $include_default_folders && folders+=("${DEFAULT_MONITOR_DIRS[@]}")
    folders+=("${extra_folders[@]}")
    if (( ${#folders[@]} > 0 )); then
        require_cmd du || return 127
        echo ""
        render_folder_usage "${folders[@]}"
    fi

    echo ""
    echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
}

# ---------------------------------------------------------------------------
# Operation: watch
# ---------------------------------------------------------------------------

op_watch() {
    OPS_CURRENT_OP="watch"
    local interval=10
    local -a paths=("${DEFAULT_MONITOR_FS[@]}")
    local -a extra_folders=()
    local include_default_folders=true

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
            --no-folders)
                include_default_folders=false
                ;;
            -h|--help)
                echo "usage: ops_disk.sh disk-watch [folder...] [--interval N] [--path /a,/b] [--no-folders]"
                return 0
                ;;
            *)
                extra_folders+=("$1")
                ;;
        esac
        shift
    done

    if ! [[ "$interval" =~ ^[0-9]+$ ]] || (( interval < 1 )); then
        err "--interval must be a positive integer"
        return 1
    fi

    require_cmd df || return 127

    local -a folders=()
    $include_default_folders && folders+=("${DEFAULT_MONITOR_DIRS[@]}")
    folders+=("${extra_folders[@]}")
    (( ${#folders[@]} > 0 )) && { require_cmd du || return 127; }

    # Initial blank frame. We redraw in place; scrollback above is preserved.
    echo ""
    while :; do
        # Cursor to home; frame; clear-to-end-of-screen.
        printf '\033[H'
        banner "DISK USAGE (watch - interval ${interval}s, Ctrl+C to stop)"
        print_usage_header
        render_fs_usage "${paths[@]}"
        if (( ${#folders[@]} > 0 )); then
            echo ""
            render_folder_usage "${folders[@]}"
        fi
        echo ""
        echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
        printf '\033[J'
        sleep "$interval"
    done
}

# ---------------------------------------------------------------------------
# Operation: release-deleted (release blocks of deleted-but-open files)
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
                echo "usage: ops_disk.sh release-deleted <path> [--dry-run] [--ignore-recent] [--yes]"
                return 0
                ;;
            *)
                [[ -z "$path_prefix" ]] && path_prefix="$1"
                ;;
        esac
        shift
    done

    if [[ -z "$path_prefix" ]]; then
        err "release-deleted requires <path>"
        echo "usage: ops_disk.sh release-deleted <path> [--dry-run] [--ignore-recent] [--yes]" >&2
        return 1
    fi

    require_cmd lsof awk stat truncate || return 127

    banner "RELEASE DELETED-BUT-OPEN FDs ($path_prefix)"
    if $dry_run;       then echo "Mode         : DRY RUN (listing only)"; fi
    if $ignore_recent; then echo "Age filter   : skip files modified <2d ago"; fi
    echo "Path prefix  : $path_prefix"
    echo ""

    # Cron-safe serialization. Two concurrent cleanups racing on the same
    # prefix would just duplicate work - with_lock makes the second invocation
    # exit 75 instead.
    local lock_key
    lock_key="disk-release-deleted-$(echo -n "$path_prefix" | tr -c 'A-Za-z0-9' '-')"
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
    # Default events: lifecycle (create/delete), content changes (modify),
    # and renames into/out of the tree (move == moved_to + moved_from).
    # On a hot directory `modify` is noisy - tune with `--events`.
    local target=""
    local events_csv="create,delete,modify,move"

    while (( $# > 0 )); do
        case "$1" in
            --events)   events_csv="${2:-}"; shift 2; continue ;;
            --events=*) events_csv="${1#--events=}" ;;
            -h|--help)
                echo "usage: ops_disk.sh monitor <path> [--events e1,e2,...]"
                echo "events: create, delete, modify, move, attrib,"
                echo "        access, open, close, close_write, ..."
                return 0
                ;;
            *)
                [[ -z "$target" ]] && target="$1"
                ;;
        esac
        shift
    done

    if [[ -z "$target" ]]; then
        err "monitor requires <path>"
        echo "usage: ops_disk.sh monitor <path> [--events e1,e2,...]" >&2
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

    # Build -e flags from the comma-separated event list.
    local -a event_flags=() __evs=()
    local e
    IFS=',' read -r -a __evs <<< "$events_csv"
    for e in "${__evs[@]}"; do
        e="${e//[[:space:]]/}"
        [[ -n "$e" ]] && event_flags+=(-e "$e")
    done
    if (( ${#event_flags[@]} == 0 )); then
        err "no events specified (use --events e1,e2,...)"
        return 1
    fi

    banner "DISK MONITOR ($target)"
    echo "Events       : $events_csv"
    echo "Watching recursively. Ctrl+C to stop."
    echo ""

    # inotifywait's own --timefmt handles timestamps, so the old background
    # 'divider' subshell (which could leak on unclean exit) is gone.
    inotifywait -r -m "${event_flags[@]}" \
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
    menu_clear
    banner "PACKRAT DISK OPS"
    echo "[1] Usage           - one-shot df + parallel du on monitored folders"
    echo "[2] Disk-Watch      - real-time df loop (df only; system menu for I/O)"
    echo "[3] Release-Deleted - reclaim blocks of deleted-but-open files"
    echo "[4] Monitor         - inotify event stream on a path"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c arg
    read -r -p "Choose: " c
    case "$c" in
        1)
            read -r -p "Extra folder for du (blank=defaults only): " arg
            run_op op_usage ${arg:+"$arg"} || return $MENU_RC_QUIT
            ;;
        2)
            read -r -p "Extra folder for du (blank=defaults only): " arg
            run_op op_watch ${arg:+"$arg"} || return $MENU_RC_QUIT
            ;;
        3)
            read -r -p "Path prefix (e.g. /staging): " arg
            run_op op_cleanup "$arg" || return $MENU_RC_QUIT
            ;;
        4)
            read -r -p "Directory to monitor: " arg
            run_op op_monitor "$arg" || return $MENU_RC_QUIT
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
        usage)            op_usage   "$@" || rc=$? ;;
        disk-watch)       op_watch   "$@" || rc=$? ;;
        release-deleted)  op_cleanup "$@" || rc=$? ;;
        monitor)          op_monitor "$@" || rc=$? ;;
        watch)
            err "'watch' has been renamed to 'disk-watch' (clarifies scope vs ops_system.sh monitor)"
            err "rerun: ops_disk.sh disk-watch $*"
            rc=1
            ;;
        cleanup)
            err "'cleanup' has been renamed to 'release-deleted' (clarifies it does NOT delete files)"
            err "rerun: ops_disk.sh release-deleted $*"
            rc=1
            ;;
        *)                err "unknown op: $OP"; rc=1 ;;
    esac
    (( rc != 0 )) && status="FAIL"
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
