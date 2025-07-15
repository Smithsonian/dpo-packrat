#!/bin/bash

BAR_WIDTH=30
NET_DEV=$(ip route | awk '/default/ {print $5}' | head -n 1)

# Clear screen once at startup
clear
tput civis

# On exit: clear screen and show cursor
cleanup() {
    tput cnorm
    clear
    exit
}
trap cleanup INT TERM

draw_bar() {
    local PERCENT=$1
    local FILLED=$((PERCENT * BAR_WIDTH / 100))
    local EMPTY=$((BAR_WIDTH - FILLED))
    printf "["
    printf "%0.s#" $(seq 1 $FILLED)
    printf "%0.s " $(seq 1 $EMPTY)
    printf "] %3d%%" "$PERCENT"
}

capture_io_baseline() {
    DISK_STATS_1=$(iostat -d 1 1 | awk 'NR>6 {r+=$3; w+=$4} END {printf "%d %d", r, w}')
    RX1=$(awk -v dev="$NET_DEV" '$0 ~ dev {print $2}' /proc/net/dev)
    TX1=$(awk -v dev="$NET_DEV" '$0 ~ dev {print $10}' /proc/net/dev)
}

pad_line() {
    local line="$1"
    printf "%s%*s\n" "$line" $((80 - ${#line})) ""
}

get_cpu_usage() {
    # Read total CPU line from /proc/stat
    read cpu user nice system idle iowait irq softirq steal guest guest_nice < /proc/stat
    CPU_TOTAL_1=$((user + nice + system + idle + iowait + irq + softirq + steal))
    CPU_IDLE_1=$((idle + iowait))

    sleep 1

    read cpu user nice system idle iowait irq softirq steal guest guest_nice < /proc/stat
    CPU_TOTAL_2=$((user + nice + system + idle + iowait + irq + softirq + steal))
    CPU_IDLE_2=$((idle + iowait))

    CPU_DELTA=$((CPU_TOTAL_2 - CPU_TOTAL_1))
    IDLE_DELTA=$((CPU_IDLE_2 - CPU_IDLE_1))

    CPU_USED=$((100 * (CPU_DELTA - IDLE_DELTA) / CPU_DELTA))
    echo "$CPU_USED"
}

get_deleted_bytes() {
    timeout 2s lsof -nP +L1 /staging 2>/dev/null | awk '
        /deleted/ && $7 ~ /^[0-9]+$/ { sum += $7 }
        END { print sum }
    '
}

format_bytes() {
    local bytes=$1
    if [[ $bytes -ge 1073741824 ]]; then
        echo "$(bc <<< "scale=2; $bytes/1073741824") GB"
    elif [[ $bytes -ge 1048576 ]]; then
        echo "$(bc <<< "scale=2; $bytes/1048576") MB"
    elif [[ $bytes -ge 1024 ]]; then
        echo "$(bc <<< "scale=2; $bytes/1024") KB"
    else
        echo "${bytes} B"
    fi
}

while true; do
    echo -en "\033[H"

    pad_line "PACKRAT SYSTEM MONITOR  (Press Ctrl+C to exit)"
    pad_line "================================================="

    # CPU
    CPU_USED=$(get_cpu_usage)
    printf "%-16s " "CPU Usage:"
    draw_bar "$CPU_USED"
    printf "%20s\n" ""

    # Memory
    read -r MEM_TOTAL MEM_USED MEM_FREE MEM_SHARED MEM_BUFF MEM_CACHE <<< $(free -m | awk '/Mem:/ {print $2, $3, $4, $5, $6, $7}')
    MEM_PCT=$((100 * MEM_USED / MEM_TOTAL))
    SWAP_USED=$(free -m | awk '/Swap:/ {print $3}')
    SWAP_TOTAL=$(free -m | awk '/Swap:/ {print $2}')
    printf "%-16s " "Memory Usage:"
    draw_bar $MEM_PCT
    printf "%20s\n" ""
    pad_line "   Cache: ${MEM_CACHE} MB   Swap: ${SWAP_USED}/${SWAP_TOTAL} MB"

    # Disk and network I/O baseline
    capture_io_baseline
    sleep 1
    DISK_STATS_2=$(iostat -d 1 1 | awk 'NR>6 {r+=$3; w+=$4} END {printf "%d %d", r, w}')
    RX2=$(awk -v dev="$NET_DEV" '$0 ~ dev {print $2}' /proc/net/dev)
    TX2=$(awk -v dev="$NET_DEV" '$0 ~ dev {print $10}' /proc/net/dev)

    DISK_READ_1=$(echo $DISK_STATS_1 | awk '{print $1}')
    DISK_WRITE_1=$(echo $DISK_STATS_1 | awk '{print $2}')
    DISK_READ_2=$(echo $DISK_STATS_2 | awk '{print $1}')
    DISK_WRITE_2=$(echo $DISK_STATS_2 | awk '{print $2}')

    DISK_READ=$((DISK_READ_2 - DISK_READ_1))
    DISK_WRITE=$((DISK_WRITE_2 - DISK_WRITE_1))
    RX_KB=$(( (RX2 - RX1) / 1024 ))
    TX_KB=$(( (TX2 - TX1) / 1024 ))

    pad_line ""
    pad_line "Disk I/O:      Read ${DISK_READ} MB/s   Write ${DISK_WRITE} MB/s"
    pad_line "Network I/O:   RX ${RX_KB} KB/s   TX ${TX_KB} KB/s"

    pad_line ""
    pad_line "Disk Usage:"
    df -h --output=target,pcent | grep -vE '^Mounted' | while read -r mount usage; do
        PCT=$(echo "$usage" | tr -d '%')
        PCT_PADDED=$(printf "%3d%%" "$PCT")
        BAR=$(draw_bar "$PCT")

        # Fixed column where bar should start (e.g., column 30)
        BAR_START_COL=32
        MOUNT_DISPLAY=$(printf "%-30s" "$mount")
        printf "%s%s\n" "$MOUNT_DISPLAY" "$BAR $PCT_PADDED"
    done

    pad_line ""
    DELETED_BYTES=$(get_deleted_bytes)
    DELETED_HR=$(format_bytes "$DELETED_BYTES")
    pad_line "Deleted Files on /staging: $DELETED_HR pending"

done
