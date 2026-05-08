#!/bin/bash
#
# ops_system.sh - Packrat system ops (monitor, remount, perf, procinfo)
#
# Replaces: ops_monitor.sh, ops_system.sh (old)
#
# Usage:
#   ./ops_system.sh                           # fully interactive
#   ./ops_system.sh <op> [args...]            # non-interactive
#
# Operations:
#   monitor                                   # real-time CPU/mem/disk/net dashboard
#   remount                                   # umount + mount $MOUNT_POINT
#   perf [1|2|3] | [10G|100G|1TB]             # dd read/write test on $MOUNT_POINT
#   procinfo [pid]                            # detail for PID; top-5 CPU if omitted
#
# These ops are host-scoped, not env-scoped, so no env prompt is shown.
#
# For "what file events are happening under <path>?" use:
#     ./ops_disk.sh monitor <path>
# (inotify event stream - lower cost than the old `files` lsof loop).
# For a one-shot snapshot of who has handles open under a tree:
#     lsof +D <path> | head
#
# Dependencies (checked per-op):
#   monitor  : df, free, tput, awk
#   remount  : mount, umount, sudo
#   perf     : dd  (rerun with sudo if your --src or --dst is root-owned)
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

# Default src/dst for the perf op. The headline measurement is
# throughput between two locations - typically local-disk -> NFS.
PERF_DEFAULT_SRC="${PERF_DEFAULT_SRC:-/data}"
PERF_DEFAULT_DST="${PERF_DEFAULT_DST:-$MOUNT_POINT}"

# Dashboard rendering
BAR_WIDTH=30

# ---------------------------------------------------------------------------
# Operation: monitor (real-time dashboard)
# ---------------------------------------------------------------------------

# Draw a $BAR_WIDTH-char progress bar for $1 percent.
draw_bar() {
    local pct="$1"
    local filled=$(( pct * BAR_WIDTH / 100 ))
    (( filled < 0 )) && filled=0
    (( filled > BAR_WIDTH )) && filled=BAR_WIDTH
    local empty=$(( BAR_WIDTH - filled ))
    local hashes='##############################'
    local spaces='                              '
    printf '[%s%s] %3d%%' "${hashes:0:filled}" "${spaces:0:empty}" "$pct"
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

    # Disk: sum sectors across whole physical disks ONLY.
    # /proc/diskstats fields: maj min name reads reads_merged sect_r ms_r
    #                         writes writes_merged sect_w ms_w ...
    # /sys/block/<name>/ exists for whole disks but not partitions
    # (partitions live one level deeper: /sys/block/sda/sda1/).
    # We also exclude dm-*/md* so LVM/RAID I/O isn't double-counted on top
    # of the underlying physical devices.
    local d_read=0 d_write=0
    local _maj _min name _r _rm sr _msr _w _wm sw _rest2
    while read -r _maj _min name _r _rm sr _msr _w _wm sw _rest2; do
        [[ -d "/sys/block/$name" ]] || continue
        case "$name" in
            loop*|ram*|sr*|fd*|zram*|dm-*|md*) continue ;;
        esac
        d_read=$(( d_read + ${sr:-0} ))
        d_write=$(( d_write + ${sw:-0} ))
    done < /proc/diskstats
    # Sectors are 512B in /proc/diskstats regardless of hw_sector_size.
    printf -v "${prefix}_DISK_READ_BYTES"  '%d' "$(( d_read  * 512 ))"
    printf -v "${prefix}_DISK_WRITE_BYTES" '%d' "$(( d_write * 512 ))"

    # Network: sum RX + TX bytes across "real" interfaces.
    # /proc/net/dev fields after the colon:
    #   1=rx_bytes 2=rx_packets ... 9=tx_bytes 10=tx_packets ...
    # Skip lo and the usual virtual / container interfaces; this gives a
    # number that tracks actual NIC throughput (NFS, client traffic, etc.)
    # rather than docker bridge chatter.
    local rx tx
    read -r rx tx < <(
        awk '
            NR <= 2 { next }
            {
                # strip trailing colon from interface name
                ifname = $1
                sub(/:$/, "", ifname)
                if (ifname == "lo") next
                if (ifname ~ /^(docker|veth|br-|virbr|tun|tap|cni|flannel|kube|cali|weave|vxlan|gre|geneve)/) next
                rx += $2
                tx += $10
            }
            END { printf "%d %d\n", rx+0, tx+0 }
        ' /proc/net/dev
    )
    printf -v "${prefix}_NET_RX_BYTES" '%d' "${rx:-0}"
    printf -v "${prefix}_NET_TX_BYTES" '%d' "${tx:-0}"
}

format_bytes() {
    local bytes="${1:-0}"
    if (( bytes >= 1073741824 )); then
        local x100=$(( bytes * 100 / 1073741824 ))
        printf '%d.%02d GB' "$(( x100 / 100 ))" "$(( x100 % 100 ))"
    elif (( bytes >= 1048576 )); then
        local x100=$(( bytes * 100 / 1048576 ))
        printf '%d.%02d MB' "$(( x100 / 100 ))" "$(( x100 % 100 ))"
    elif (( bytes >= 1024 )); then
        local x100=$(( bytes * 100 / 1024 ))
        printf '%d.%02d KB' "$(( x100 / 100 ))" "$(( x100 % 100 ))"
    else
        printf '%d B' "$bytes"
    fi
}

# Fixed-width auto-scaled rate (always 11 chars: "  0.0 KB/s" .. "1234.5 MB/s")
format_rate() {
    local bps="${1:-0}"
    if (( bps >= 1073741824 )); then
        local x10=$(( bps * 10 / 1073741824 ))
        printf '%4d.%d GB/s' "$(( x10 / 10 ))" "$(( x10 % 10 ))"
    elif (( bps >= 1048576 )); then
        local x10=$(( bps * 10 / 1048576 ))
        printf '%4d.%d MB/s' "$(( x10 / 10 ))" "$(( x10 % 10 ))"
    elif (( bps >= 1024 )); then
        local x10=$(( bps * 10 / 1024 ))
        printf '%4d.%d KB/s' "$(( x10 / 10 ))" "$(( x10 % 10 ))"
    else
        printf '%6d B/s' "$bps"
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

    require_cmd df free tput awk || return 127

    clear
    tput civis

    # Install monitor-specific exit behavior (overrides common's EXIT trap
    # for the duration of this op; print_summary still runs via the parent
    # script's exit path).
    trap '__monitor_cleanup; INTERRUPTED=1; print_summary "INTERRUPTED"; exit 130' INT TERM
    trap '__monitor_cleanup' EXIT

    # Filter for the disk-usage block: drop virtual filesystems (tmpfs,
    # cgroup, etc.) and docker overlay/snap mounts. What's left is the
    # set of "real" disk-backed mounts the operator actually cares about.
    # Emits: target  size  used  pcent
    local df_filter='
        NR == 1 { next }
        $1 ~ /\/docker\/overlay2\// { next }
        $1 ~ /\/var\/lib\/docker\// { next }
        $1 ~ /\/snap\// { next }
        $2 ~ /^(tmpfs|devtmpfs|cgroup|cgroup2|proc|sysfs|overlay|squashfs|devpts|nsfs|securityfs|debugfs|tracefs|configfs|fusectl|mqueue|hugetlbfs|pstore|bpf|autofs|binfmt_misc|rpc_pipefs)$/ { next }
        $2 ~ /^fuse\./ { next }
        { print $1, $3, $4, $5 }
    '

    while :; do
        snapshot_counters BEFORE
        sleep 1
        snapshot_counters AFTER

        # CPU %
        local cpu_delta=$(( AFTER_CPU_TOTAL - BEFORE_CPU_TOTAL ))
        local idle_delta=$(( AFTER_CPU_IDLE - BEFORE_CPU_IDLE ))
        local cpu_used=0
        (( cpu_delta > 0 )) && cpu_used=$(( 100 * (cpu_delta - idle_delta) / cpu_delta ))

        # Disk I/O bytes-per-second (sample window is 1s, so delta == /s).
        local disk_read_bps=$(( AFTER_DISK_READ_BYTES  - BEFORE_DISK_READ_BYTES  ))
        local disk_write_bps=$(( AFTER_DISK_WRITE_BYTES - BEFORE_DISK_WRITE_BYTES ))
        local net_rx_bps=$(( AFTER_NET_RX_BYTES - BEFORE_NET_RX_BYTES ))
        local net_tx_bps=$(( AFTER_NET_TX_BYTES - BEFORE_NET_TX_BYTES ))

        # Memory
        local mem_line swap_line mem_total mem_used mem_cache swap_used swap_total
        mem_line=$(free -m  | awk '/^Mem:/  {print $2, $3, $6}')
        swap_line=$(free -m | awk '/^Swap:/ {print $2, $3}')
        read -r mem_total mem_used mem_cache <<< "$mem_line"
        read -r swap_total swap_used        <<< "$swap_line"
        local mem_pct=0
        (( mem_total > 0 )) && mem_pct=$(( 100 * mem_used / mem_total ))

        # Move to home, render frame with per-line clear-to-EOL so previous
        # (possibly longer) frames cannot bleed through.
        printf '\033[H'
        printf 'PACKRAT SYSTEM MONITOR  (Ctrl+C to exit)\033[K\n'
        printf '=================================================\033[K\n'

        printf '%-16s %s\033[K\n' "CPU Usage:"    "$(draw_bar "$cpu_used")"
        printf '%-16s %s\033[K\n' "Memory Usage:" "$(draw_bar "$mem_pct")"
        printf '   Cache: %s MB   Swap: %s/%s MB\033[K\n' \
            "$mem_cache" "$swap_used" "$swap_total"

        printf '\033[K\n'
        printf 'Disk I/O:        Read %s   Write %s\033[K\n' \
            "$(format_rate "$disk_read_bps")" "$(format_rate "$disk_write_bps")"
        printf 'Network I/O:     RX   %s   TX   %s\033[K\n' \
            "$(format_rate "$net_rx_bps")" "$(format_rate "$net_tx_bps")"

        printf '\033[K\n'
        printf 'Disk Usage:\033[K\n'
        local m sz used p pct
        while read -r m sz used p; do
            pct=${p%\%}
            [[ -z "$pct" ]] && continue
            printf '  %-30s %s  %6s / %-6s\033[K\n' \
                "$m" "$(draw_bar "$pct")" "$used" "$sz"
        done < <(df -h --output=target,fstype,size,used,pcent 2>/dev/null | awk "$df_filter")

        printf '\033[K\n'
        local deleted_bytes deleted_hr
        deleted_bytes=$(get_deleted_bytes)
        deleted_hr=$(format_bytes "${deleted_bytes:-0}")
        printf 'Deleted files on /staging: %s pending\033[K\n' "$deleted_hr"

        # Belt-and-suspenders: clear anything below the new frame in case
        # the previous frame had MORE rows (e.g. a transient mount appeared).
        printf '\033[J'
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
    local size_arg=""
    local src=""
    local dst=""
    local bs count label

    while (( $# > 0 )); do
        case "$1" in
            --src)    src="${2:-}"; shift 2; continue ;;
            --src=*)  src="${1#--src=}" ;;
            --dst)    dst="${2:-}"; shift 2; continue ;;
            --dst=*)  dst="${1#--dst=}" ;;
            -h|--help)
                echo "usage: ops_system.sh perf [1|2|3|10G|100G|1TB] [--src DIR] [--dst DIR]"
                echo "  default src=$PERF_DEFAULT_SRC  default dst=$PERF_DEFAULT_DST"
                return 0
                ;;
            *)
                [[ -z "$size_arg" ]] && size_arg="$1"
                ;;
        esac
        shift
    done

    # Test size: prompt only if not specified and we have a TTY.
    if [[ -z "$size_arg" ]]; then
        if is_tty; then
            echo "Select test size:"
            echo "  [1] 10G   (fast)"
            echo "  [2] 100G  (medium)"
            echo "  [3] 1TB   (long)"
            local c
            read -r -p "Choose: " c
            size_arg="$c"
        else
            err "perf needs a size when run non-interactively (use 1|2|3 or 10G|100G|1TB)"
            return 1
        fi
    fi
    case "$size_arg" in
        1|10G|10g)        bs=10M;  count=1024; label="10G"  ;;
        2|100G|100g)      bs=100M; count=1024; label="100G" ;;
        3|1T|1t|1TB|1tb)  bs=1G;   count=1024; label="1TB"  ;;
        *)
            err "unknown size: '$size_arg' (use 1|2|3 or 10G|100G|1TB)"
            return 1
            ;;
    esac

    # Source / dest dirs: prompt only when interactive and unset.
    if [[ -z "$src" ]]; then
        if is_tty; then
            local input
            read -r -p "Source dir (blank=$PERF_DEFAULT_SRC): " input
            src="${input:-$PERF_DEFAULT_SRC}"
        else
            src="$PERF_DEFAULT_SRC"
        fi
    fi
    if [[ -z "$dst" ]]; then
        if is_tty; then
            local input
            read -r -p "Dest dir   (blank=$PERF_DEFAULT_DST): " input
            dst="${input:-$PERF_DEFAULT_DST}"
        else
            dst="$PERF_DEFAULT_DST"
        fi
    fi

    require_cmd dd || return 127
    [[ -d "$src" ]] || { err "source not a directory: $src"; return 1; }
    [[ -d "$dst" ]] || { err "dest not a directory: $dst"; return 1; }
    [[ -w "$src" ]] || { err "source not writable: $src (rerun with sudo or pick a writable dir)"; return 1; }
    [[ -w "$dst" ]] || { err "dest not writable: $dst (rerun with sudo or pick a writable dir)"; return 1; }

    # Refuse identical paths - meaningless test and could collide on the same file.
    local src_real dst_real
    src_real="$(readlink -f -- "$src")"
    dst_real="$(readlink -f -- "$dst")"
    if [[ "$src_real" == "$dst_real" ]]; then
        err "source and dest resolve to the same directory ($src_real)"
        return 1
    fi

    # Per-run unique filenames so concurrent invocations cannot clobber each other.
    local stamp="$(date +%s).$$"
    local src_file="$src/.packrat-perf-${stamp}"
    local dst_file="$dst/.packrat-perf-${stamp}"
    register_tmp_file "$src_file"
    register_tmp_file "$dst_file"

    banner "DISK PERF ($label)"
    echo "Source      : $src"
    echo "Dest        : $dst"
    echo "Block size  : $bs   Count: $count"
    echo ""

    # Stage 1: source write speed (also produces the file we'll copy).
    # oflag=direct bypasses the page cache so the number reflects the
    # underlying device, not RAM. NFS / overlayfs may reject O_DIRECT;
    # if dd errors out, the operator can switch to a local source dir.
    echo "[1/3] Source write speed (write to $src) ..."
    dd if=/dev/zero of="$src_file" bs="$bs" count="$count" oflag=direct
    echo ""

    # Stage 2: cross-mount transfer - the headline measurement.
    echo "[2/3] Cross-mount transfer ($src -> $dst) ..."
    dd if="$src_file" of="$dst_file" bs="$bs" iflag=direct oflag=direct
    echo ""

    # Stage 3: dest read speed (read back from the file we just copied).
    echo "[3/3] Dest read speed (read from $dst) ..."
    dd if="$dst_file" of=/dev/null bs="$bs" count="$count" iflag=direct
    echo ""

    echo "Cleaning up sample files ..."
    rm -f -- "$src_file" "$dst_file"
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
    menu_clear
    banner "PACKRAT SYSTEM OPS"
    echo "[1] Monitor  - real-time CPU/mem/disk/net dashboard"
    echo "[2] Remount  - !! unmount + remount $MOUNT_POINT (root required)"
    echo "[3] Perf     - dd cross-mount throughput test (10G/100G/1TB)"
    echo "[4] Procinfo - process detail (read-only)"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c arg
    read -r -p "Choose: " c
    case "$c" in
        1) run_op op_monitor || return $MENU_RC_QUIT ;;
        2) run_op op_remount || return $MENU_RC_QUIT ;;
        3) run_op op_perf    || return $MENU_RC_QUIT ;;
        4)
            read -r -p "PID (blank=top5): " arg
            run_op op_procinfo "$arg" || return $MENU_RC_QUIT
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
        monitor)  op_monitor  "$@" || rc=$? ;;
        remount)  op_remount  "$@" || rc=$? ;;
        perf)     op_perf     "$@" || rc=$? ;;
        procinfo) op_procinfo "$@" || rc=$? ;;
        files)
            err "'files' has been removed (redundant with: ops_disk.sh monitor <path>)"
            err "for a snapshot of open FDs:  lsof +D <path> | head"
            rc=1
            ;;
        *)        err "unknown op: $OP"; rc=1 ;;
    esac
    (( rc != 0 )) && status="FAIL"
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
