#!/bin/bash
#
# ops_hardware.sh - Packrat host hardware health (BMC / sensors / software RAID)
#
# Read-only. Host-level (not env-keyed), so no environment prompt.
#
# Usage:
#   ./ops_hardware.sh                 # interactive menu
#   ./ops_hardware.sh <op>            # non-interactive
#
# Subcommands:
#   status     roll-up: chassis faults + sensor rollup + mdadm RAID (exit 0/1/2)
#   sensors    raw `ipmitool sdr list`
#   sel        raw `ipmitool sel list` (hardware event log)
#   raid       `/proc/mdstat` + `mdadm --detail` per array
#
# Exit code (status): 0 OK, 1 WARN, 2 FAIL - suitable for cron/monitoring.
# iDRAC/IPMI access is in-band; run as root (or via sudo) for sensor reads.
#

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_hardware.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"
# shellcheck source=lib/health_checks.sh
source "$HERE/lib/health_checks.sh"

init_traps

# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

op_status() {
    OPS_CURRENT_OP="status"
    banner "HARDWARE HEALTH"
    hc_reset
    hc_check_bmc
    hc_check_raid
    hc_check_sensors
    hc_summary "HARDWARE"
    return $?
}

op_sensors() {
    OPS_CURRENT_OP="sensors"
    require_cmd ipmitool || return 127
    banner "IPMI SENSORS (sdr list)"
    ipmitool sdr list
}

op_sel() {
    OPS_CURRENT_OP="sel"
    require_cmd ipmitool || return 127
    banner "IPMI EVENT LOG (sel list)"
    ipmitool sel list
}

op_raid() {
    OPS_CURRENT_OP="raid"
    banner "SOFTWARE RAID (mdadm)"
    if [[ -r /proc/mdstat ]]; then
        cat /proc/mdstat
    else
        note "no /proc/mdstat on this host"
        return 0
    fi
    if command -v mdadm >/dev/null 2>&1; then
        local md
        for md in /dev/md/* /dev/md[0-9]*; do
            [[ -e "$md" ]] || continue
            hr
            mdadm --detail "$md" 2>/dev/null || true
        done
    fi
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    menu_clear
    banner "PACKRAT HARDWARE OPS"
    echo "[1] Status  - BMC + sensors + RAID roll-up (read-only)"
    echo "[2] Sensors - raw ipmitool sdr list"
    echo "[3] SEL     - hardware event log"
    echo "[4] RAID    - mdadm array detail"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1) run_op op_status  || return "$MENU_RC_QUIT" ;;
        2) run_op op_sensors || return "$MENU_RC_QUIT" ;;
        3) run_op op_sel     || return "$MENU_RC_QUIT" ;;
        4) run_op op_raid    || return "$MENU_RC_QUIT" ;;
        [Bb]) return "$MENU_RC_BACK" ;;
        [Qq]) return "$MENU_RC_QUIT" ;;
        *) err "invalid choice" ;;
    esac
    return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() { sed -n '2,27p' "$0"; }

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
        status)  op_status  "$@"; rc=$? ;;
        sensors) op_sensors "$@"; rc=$? ;;
        sel)     op_sel     "$@"; rc=$? ;;
        raid)    op_raid    "$@"; rc=$? ;;
        *)       err "unknown op: $OP"; rc=1 ;;
    esac
    case "$rc" in 0) status="OK" ;; 1) status="WARN" ;; *) status="FAIL" ;; esac
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
