#!/bin/bash
#
# ops_health.sh - Packrat whole-system health roll-up (read-only, Zabbix-independent)
#
# One-shot PASS/WARN/FAIL across the box. The resilient/transparent fallback
# to Zabbix: safe to run any time, in cron, or mid-incident. Nothing is mutated.
#
# Usage:
#   ./ops_health.sh                   # (no args) interactive menu
#   ./ops_health.sh host              # host-level checks only (non-interactive)
#   ./ops_health.sh <env>             # host checks + that env's app stack
#   ./ops_health.sh <env> --quiet     # summary + problems only (cron-friendly)
#
# Checks:
#   Hardware     BMC chassis faults, mdadm RAID, IPMI sensor roll-up
#   Network      NIC links, default routes, integration egress, NFS mounts
#   Host svcs    local-disk usage, nginx (active + config + listeners), MariaDB
#   App stack    (env only) containers running, Solr cores, server /heartbeat
#
# Exit code (Nagios-style, for cron/monitoring): 0 OK, 1 WARN, 2 FAIL.
# Tunables (endpoints, thresholds) come from the sibling .env - see
# lib/health_checks.sh (HEALTH_EGRESS_TARGETS, HEALTH_DISK_WARN_PCT, ...).
#

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_health.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"
# shellcheck source=lib/health_checks.sh
source "$HERE/lib/health_checks.sh"

init_traps

# ---------------------------------------------------------------------------
# The roll-up
# ---------------------------------------------------------------------------

op_run() {
    OPS_CURRENT_OP="health"
    local env="${1:-}"
    banner "PACKRAT HEALTH ROLL-UP"
    if [[ -n "$env" ]]; then
        echo "Scope: host + app stack ($env)"
    else
        echo "Scope: host-level only (pass an env to include the app stack)"
    fi

    hc_reset

    echo ""; echo "== Hardware =="
    hc_check_bmc
    hc_check_raid
    hc_check_sensors

    echo ""; echo "== Network =="
    hc_check_links
    hc_check_bonds
    hc_check_routes
    hc_check_egress
    hc_check_mounts

    echo ""; echo "== Host services =="
    hc_check_disk
    hc_check_nginx
    hc_check_db

    if [[ -n "$env" ]]; then
        echo ""; echo "== App stack ($env) =="
        hc_check_containers "$env"
        hc_check_solr
        hc_check_heartbeat
    fi

    hc_summary "HEALTH"
    return $?
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    menu_clear
    banner "PACKRAT HEALTH ROLL-UP"
    echo "[1] Host-level only"
    echo "[2] Host + Production app stack"
    echo "[3] Host + Staging app stack"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1) run_op op_run ""        || return "$MENU_RC_QUIT" ;;
        2) run_op op_run "prod"    || return "$MENU_RC_QUIT" ;;
        3) run_op op_run "staging" || return "$MENU_RC_QUIT" ;;
        [Bb]) return "$MENU_RC_BACK" ;;
        [Qq]) return "$MENU_RC_QUIT" ;;
        *) err "invalid choice" ;;
    esac
    return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() { sed -n '2,30p' "$0"; }

ENV_ARG=""
INTERACTIVE=1
for a in "$@"; do
    case "$a" in
        -h|--help) print_help; exit 0 ;;
        -q|--quiet) export HEALTH_QUIET=1; INTERACTIVE=0 ;;
        *)
            if [[ -z "$ENV_ARG" ]]; then ENV_ARG="$a"; INTERACTIVE=0
            else err "unexpected arg: $a"; exit 1; fi
            ;;
    esac
done

status="OK"
rc=0

if (( INTERACTIVE )); then
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
    env_norm=""
    # "host" is the explicit non-interactive host-only form; anything else is
    # treated as an environment for the app-stack checks.
    if [[ -n "$ENV_ARG" && "$ENV_ARG" != "host" ]]; then
        if normalize_env "$ENV_ARG"; then env_norm="$ENVIRONMENT"; else exit 1; fi
    fi
    op_run "$env_norm"; rc=$?
    case "$rc" in
        0) status="OK" ;;
        1) status="WARN" ;;
        *) status="FAIL" ;;
    esac
    print_summary "$status"
fi

# rc is 0/1/2 (health verdict) on the CLI path - preserved for cron/monitoring;
# menu_translate_exit only rewrites the interactive operator-Q sentinel.
exit "$(menu_translate_exit "$rc")"
