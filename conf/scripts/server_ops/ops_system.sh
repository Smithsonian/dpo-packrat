#!/bin/bash
#
# ops_system.sh - Packrat system ops (monitor, files, remount, perf, procinfo)
#
# Replaces: ops_monitor.sh, ops_monitorFiles.sh, ops_system.sh (old)
#
# Usage:
#   ./ops_system.sh                           # fully interactive
#   ./ops_system.sh <op> [args...]            # non-interactive
#
# Operations:
#   monitor                                   # real-time CPU/mem/disk/net dashboard
#   files <path>                              # lsof activity watcher
#   remount                                   # umount + mount $MOUNT_POINT
#   perf [1|2|3] | [10G|100G|1TB]             # dd read/write test on $MOUNT_POINT
#   procinfo [pid]                            # detail for PID; top-5 CPU if omitted
#
# These ops are host-scoped, not env-scoped, so no env prompt is shown.
#
# Dependencies (checked per-op):
#   monitor  : df, free, bc, tput, ip, awk
#   files    : lsof
#   remount  : mount, umount, sudo
#   perf     : dd, sudo
#   procinfo : ps
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_system.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"

init_traps

# ---------------------------------------------------------------------------
# Host-specific constants (edit here, not in each caller)
# ---------------------------------------------------------------------------

MOUNT_POINT="${MOUNT_POINT:-/3ddigip01}"
MOUNT_SOURCE="${MOUNT_SOURCE:-si-ocio-qnas2.si.edu:/si-3ddigi-staging}"

# Sample file for perf op - only ever created under MOUNT_POINT.
# (The old script also rm'd /data/samplefile, which was never written.)
PERF_SAMPLE_FILE="${PERF_SAMPLE_FILE:-$MOUNT_POINT/samplefile}"

# Dashboard rendering
BAR_WIDTH=30

# ---------------------------------------------------------------------------
# Operation: monitor (real-time dashboard)
# ---------------------------------------------------------------------------

# Draw an N-char progress bar for $1 percent
draw_bar() {
    local pct="$1"
    local filled=$(( pct * BAR_WIDTH / 100 ))
    (( filled < 0 )) && filled=0
    (( filled > BAR_WIDTH )) && filled=BAR_WIDTH
    local empty=$(( BAR_WIDTH - filled ))
    printf "["
    printf "%0.s#" $(seq 1 "$filled")
    (( empty > 0 )) && printf "%0.s " $(seq 1 "$empty")
    printf "] %3d%%" "$pct"
}

# Snapshot CPU/disk/network counters into vars named ${prefix}_<...>.
# Single snapshot - the caller samples twice with one sleep between.
snapshot_counters() {
    local prefix="$1"

    # CPU: sum of jiffies across all states (from /proc/stat first line)
    local cpu u n sy id io irq sirq st _rest
    read -r cpu u n sy id io irq sirq st _rest < /proc/stat
    local total=$(( u + n + sy + id + io + irq + sirq + ${st:-0} ))
    local idle=$(( id + io ))
    printf -v "${prefix}_CPU_TOTAL" '%d' "$total"
    printf -v "${prefix}_CPU_IDLE"  '%d' "$idle"

    # Disk: sum sectors across physical devices
    # /proc/diskstats: maj min name reads reads_merged sect_r ms_r writes w_m sect_w ms_w ...
    local d_read=0 d_write=0
    local line _maj _min name _r _rm sr _msr _w _wm sw _rest2
    while read -r _maj _min name _r _rm sr _msr _w _wm sw _rest2; do
        case "$name" in
            loop*|ram*|sr*|md*|dm-*) continue ;;
        esac
        d_read=$(( d_read + ${sr:-0} ))
        d_write=$(( d_write + ${sw:-0} ))
    done < /proc/diskstats
    printf -v "${prefix}_DISK_READ"  '%d' "$d_read"
    printf -v "${prefix}_DISK_WRITE" '%d' "$d_write"

    # Network: RX + TX bytes on the default interface
    local rx=0 tx=0
    if [[ -n "${NET_DEV:-}" ]]; then
        read -r rx tx < <(awk -v d="$NET_DEV" '$0 ~ d {print $2, $10}' /proc/net/dev)
    fi
    printf -v "${prefix}_NET_RX" '%d' "${rx:-0}"
    printf -v "${prefix}_NET_TX" '%d' "${tx:-0}"
}

format_bytes() {
    local bytes=$1
    if (( bytes >= 1073741824 )); then
        bc <<< "scale=2; $bytes/1073741824" | awk '{print $1" GB"}'
    elif (( bytes >= 1048576 )); then
        bc <<< "scale=2; $bytes/1048576"    | awk '{print $1" MB"}'
    elif (( bytes >= 1024 )); then
        bc <<< "scale=2; $bytes/1024"       | awk '{print $1" KB"}'
    else
        echo "${bytes} B"
    fi
}

# Sum bytes of deleted-but-held files under /staging (best-effort, 2s timeout).
get_deleted_bytes() {
    if ! command -v lsof >/dev/null 2>&1; then
        echo "0"; return
    fi
    timeout 2s lsof -nP +L1 /staging 2>/dev/null | awk '
        /deleted/ && $7 ~ /^[0-9]+$/ { sum += $7 }
        END { print sum+0 }'
}

# Restore cursor, optionally clear, before exit
__monitor_cleanup() {
    tput cnorm 2>/dev/null || true
    clear 2>/dev/null      || true
}

op_monitor() {
    OPS_CURRENT_OP="monitor"

    require_cmd df free bc tput awk ip || return 127

    NET_DEV=$(ip route | awk '/default/ {print $5}' | head -n 1)
    if [[ -z "$NET_DEV" ]]; then
        warn "no default route found - network counters will read 0"
    fi

    clear
    tput civis

    # Install monitor-specific exit behavior (overrides common's EXIT trap
    # for the duration of this op; print_summary still runs via the parent
    # script's exit path).
    trap '__monitor_cleanup; INTERRUPTED=1; print_summary "INTERRUPTED"; exit 130' INT TERM
    trap '__monitor_cleanup' EXIT

    while :; do
        snapshot_counters BEFORE
        sleep 1
        snapshot_counters AFTER

        # CPU %
        local cpu_delta=$(( AFTER_CPU_TOTAL - BEFORE_CPU_TOTAL ))
        local idle_delta=$(( AFTER_CPU_IDLE - BEFORE_CPU_IDLE ))
        local cpu_used=0
        (( cpu_delta > 0 )) && cpu_used=$(( 100 * (cpu_delta - idle_delta) / cpu_delta ))

        # Disk I/O (sectors * 512 = bytes; report MB/s)
        local disk_read_mb=$(( (AFTER_DISK_READ  - BEFORE_DISK_READ ) * 512 / 1048576 ))
        local disk_write_mb=$(( (AFTER_DISK_WRITE - BEFORE_DISK_WRITE) * 512 / 1048576 ))

        # Network I/O (KB/s)
        local rx_kb=$(( (AFTER_NET_RX - BEFORE_NET_RX) / 1024 ))
        local tx_kb=$(( (AFTER_NET_TX - BEFORE_NET_TX) / 1024 ))

        # Memory
        local mem_line swap_line mem_total mem_used mem_cache swap_used swap_total
        mem_line=$(free -m  | awk '/^Mem:/  {print $2, $3, $6}')
        swap_line=$(free -m | awk '/^Swap:/ {print $2, $3}')
        read -r mem_total mem_used mem_cache <<< "$mem_line"
        read -r swap_total swap_used        <<< "$swap_line"
        local mem_pct=0
        (( mem_total > 0 )) && mem_pct=$(( 100 * mem_used / mem_total ))

        # Move to home, render frame, clear to end of screen.
        printf '\033[H'
        echo "PACKRAT SYSTEM MONITOR  (Ctrl+C to exit)"
        echo "================================================="

        printf "%-16s " "CPU Usage:"
        draw_bar "$cpu_used"
        echo ""

        printf "%-16s " "Memory Usage:"
        draw_bar "$mem_pct"
        echo ""
        echo "   Cache: ${mem_cache} MB   Swap: ${swap_used}/${swap_total} MB"

        echo ""
        printf "Disk I/O:      Read %4d MB/s   Write %4d MB/s\n" "$disk_read_mb" "$disk_write_mb"
        printf "Network I/O:   RX %5d KB/s   TX %5d KB/s\n"       "$rx_kb"        "$tx_kb"

        echo ""
        echo "Disk Usage:"
        df -h --output=target,pcent | awk 'NR>1 {print}' | while read -r m p; do
            local pct=${p%\%}
            local bar_str
            bar_str=$(draw_bar "$pct")
            printf "%-30s %s\n" "$m" "$bar_str"
        done

        echo ""
        local deleted_bytes deleted_hr
        deleted_bytes=$(get_deleted_bytes)
        deleted_hr=$(format_bytes "${deleted_bytes:-0}")
        echo "Deleted files on /staging: ${deleted_hr} pending"

        # Clear anything left over from the previous (possibly longer) frame
        printf '\033[J'
    done
}

# ---------------------------------------------------------------------------
# Operation: files (lsof activity watcher)
# ---------------------------------------------------------------------------

op_files() {
    OPS_CURRENT_OP="files"
    local target="${1:-}"
    local interval="${2:-2}"

    if [[ -z "$target" ]]; then
        err "files requires <path>"
        echo "usage: ops_system.sh files <path> [interval-seconds]" >&2
        return 1
    fi
    if [[ ! -d "$target" ]]; then
        err "not a directory: $target"
        return 1
    fi

    require_cmd lsof || return 127

    banner "FILE ACTIVITY ($target, every ${interval}s)"
    echo "Press Ctrl+C to stop."
    echo ""

    while :; do
        echo "------------------------------------------"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] open under $target"
        lsof +D "$target" 2>/dev/null || true
        echo "------------------------------------------"
        sleep "$interval"
    done
}

# ---------------------------------------------------------------------------
# Operation: remount (unmount + remount $MOUNT_POINT)
# ---------------------------------------------------------------------------

op_remount() {
    OPS_CURRENT_OP="remount"

    require_cmd mount umount || return 127

    banner "REMOUNT $MOUNT_POINT"
    echo "Source : $MOUNT_SOURCE"
    echo ""

    # Need root (or passwordless sudo) up-front.
    if (( EUID != 0 )); then
        require_cmd sudo || return 127
        if ! sudo -n true 2>/dev/null; then
            err "remount requires root or passwordless sudo"
            err "re-run as root: sudo $OPS_SCRIPT_NAME remount"
            return 1
        fi
    fi

    local SUDO=""
    (( EUID != 0 )) && SUDO="sudo"

    if ! confirm "Unmount and remount $MOUNT_POINT?"; then
        echo "Cancelled."
        return 1
    fi

    echo "Unmounting $MOUNT_POINT ..."
    if ! $SUDO umount -l -- "$MOUNT_POINT"; then
        err "umount failed"
        return 1
    fi

    echo "Mounting $MOUNT_SOURCE -> $MOUNT_POINT ..."
    if ! $SUDO mount "$MOUNT_SOURCE" "$MOUNT_POINT"; then
        err "mount failed"
        return 1
    fi

    echo "Done."
}

# ---------------------------------------------------------------------------
# Operation: perf (dd read/write test on $MOUNT_POINT)
# ---------------------------------------------------------------------------

op_perf() {
    OPS_CURRENT_OP="perf"
    local size_arg="${1:-}"
    local bs count label

    # Accept numeric choice (1|2|3) or literal size (10G|100G|1TB).
    case "$size_arg" in
        1|10G|10g)     bs=10M;  count=1024; label="10G"  ;;
        2|100G|100g)   bs=100M; count=1024; label="100G" ;;
        3|1T|1t|1TB|1tb) bs=1G; count=1024; label="1TB"  ;;
        "")
            echo "Select test size:"
            echo "  [1] 10G   (fast)"
            echo "  [2] 100G  (medium)"
            echo "  [3] 1TB   (long)"
            local c
            read -r -p "Choose: " c
            op_perf "$c"
            return $?
            ;;
        *)
            err "unknown size: '$size_arg' (use 1|2|3 or 10G|100G|1TB)"
            return 1
            ;;
    esac

    require_cmd dd || return 127
    if [[ ! -d "$MOUNT_POINT" ]]; then
        err "$MOUNT_POINT is not mounted (or not a directory)"
        return 1
    fi

    local SUDO=""
    if (( EUID != 0 )); then
        require_cmd sudo || return 127
        SUDO="sudo"
    fi

    banner "DISK PERF ($MOUNT_POINT / $label)"
    echo "Sample file : $PERF_SAMPLE_FILE"
    echo "Block size  : $bs   Count: $count"
    echo ""

    # Make sure we clean up only what we created, even on interrupt.
    register_tmp_file "$PERF_SAMPLE_FILE"

    echo "Testing write speeds (${count} x ${bs}) ..."
    $SUDO dd if=/dev/zero of="$PERF_SAMPLE_FILE" bs="$bs" count="$count" oflag=direct

    echo ""
    echo "Testing read speeds (${count} x ${bs}) ..."
    $SUDO dd if="$PERF_SAMPLE_FILE" of=/dev/null bs="$bs" count="$count" iflag=direct

    echo ""
    echo "Cleaning up $PERF_SAMPLE_FILE ..."
    $SUDO rm -f -- "$PERF_SAMPLE_FILE"
}

# ---------------------------------------------------------------------------
# Operation: procinfo [pid]
# ---------------------------------------------------------------------------

op_procinfo() {
    OPS_CURRENT_OP="procinfo"
    local pid="${1:-}"

    require_cmd ps || return 127

    if [[ -z "$pid" ]]; then
        banner "TOP 5 PROCESSES BY CPU"
        ps -Ao user,uid,comm,pid,pcpu,tty,args --sort=-pcpu | head -n 6
        echo ""
        echo "To see detail for a specific process:"
        echo "  $OPS_SCRIPT_NAME procinfo <pid>"
        return 0
    fi

    if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
        err "not a numeric PID: '$pid'"
        return 1
    fi

    if ! kill -0 "$pid" 2>/dev/null; then
        err "no such process: $pid"
        return 1
    fi

    banner "PROCESS DETAIL (pid $pid)"
    ps -p "$pid" -o pid,vsz=MEMORY,user,group=GROUP,comm,args=ARGS
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    banner "PACKRAT SYSTEM OPS"
    echo "[1] Monitor   - real-time CPU/mem/disk/net dashboard"
    echo "[2] Files     - lsof activity watcher"
    echo "[3] Remount   - unmount + remount $MOUNT_POINT"
    echo "[4] Perf      - dd read/write test"
    echo "[5] Procinfo  - process detail"
    echo "[Q] Quit"
    echo ""
    local c arg
    read -r -p "Choose: " c
    case "$c" in
        1) op_monitor ;;
        2) read -r -p "Path to watch: " arg; op_files "$arg" ;;
        3) op_remount ;;
        4) op_perf ;;
        5)
            read -r -p "PID (blank=top5): " arg
            op_procinfo "$arg"
            ;;
        [Qq]) exit 0 ;;
        *) err "invalid choice"; return 1 ;;
    esac
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() {
    sed -n '2,28p' "$0"
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
        monitor)  op_monitor  "$@" || rc=$? ;;
        files)    op_files    "$@" || rc=$? ;;
        remount)  op_remount  "$@" || rc=$? ;;
        perf)     op_perf     "$@" || rc=$? ;;
        procinfo) op_procinfo "$@" || rc=$? ;;
        *)        err "unknown op: $OP"; rc=1 ;;
    esac
fi

(( rc != 0 )) && status="FAIL"
print_summary "$status"
exit $rc
