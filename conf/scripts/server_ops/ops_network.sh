#!/bin/bash
#
# ops_network.sh - Packrat host network health (links / routes / egress / mounts)
#
# Read-only. Host-level (not env-keyed), so no environment prompt.
#
# Usage:
#   ./ops_network.sh                  # interactive menu
#   ./ops_network.sh <op>             # non-interactive
#
# Subcommands:
#   status     roll-up: NIC links + default routes + egress + NFS mounts (exit 0/1/2)
#   egress     reachability to the integration endpoints ($HEALTH_EGRESS_TARGETS)
#   links      NIC operstate (data NICs) + a brief `ip -br addr`
#   routes     `ip route` table
#
# Exit code (status): 0 OK, 1 WARN, 2 FAIL - suitable for cron/monitoring.
# Egress targets / NFS mounts are overridable via the sibling .env
# (HEALTH_EGRESS_TARGETS, HEALTH_NFS_MOUNTS).
#

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_network.sh"

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
    banner "NETWORK HEALTH"
    hc_reset
    hc_check_links
    hc_check_routes
    hc_check_egress
    hc_check_mounts
    hc_summary "NETWORK"
    return $?
}

op_egress() {
    OPS_CURRENT_OP="egress"
    banner "EGRESS REACHABILITY"
    echo "Targets: $HEALTH_EGRESS_TARGETS"
    echo ""
    local t host port
    for t in $HEALTH_EGRESS_TARGETS; do
        host="${t%:*}"; port="${t##*:}"
        if hc_tcp "$host" "$port"; then
            printf '  [OK  ] %s\n' "$t"
        else
            printf '  [DOWN] %s\n' "$t"
        fi
    done
}

op_links() {
    OPS_CURRENT_OP="links"
    banner "NETWORK LINKS"
    hc_reset
    hc_check_links
    echo ""
    if command -v ip >/dev/null 2>&1; then
        ip -br addr 2>/dev/null || true
    fi
}

op_routes() {
    OPS_CURRENT_OP="routes"
    require_cmd ip || return 127
    banner "ROUTES"
    ip route
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    menu_clear
    banner "PACKRAT NETWORK OPS"
    echo "[1] Status - links + routes + egress + mounts roll-up (read-only)"
    echo "[2] Egress - reachability to Cook/EDAN/LDAP/SMTP/Slack"
    echo "[3] Links  - NIC operstate + addresses"
    echo "[4] Routes - routing table"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1) run_op op_status || return "$MENU_RC_QUIT" ;;
        2) run_op op_egress || return "$MENU_RC_QUIT" ;;
        3) run_op op_links  || return "$MENU_RC_QUIT" ;;
        4) run_op op_routes || return "$MENU_RC_QUIT" ;;
        [Bb]) return "$MENU_RC_BACK" ;;
        [Qq]) return "$MENU_RC_QUIT" ;;
        *) err "invalid choice" ;;
    esac
    return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() { sed -n '2,28p' "$0"; }

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
        status) op_status "$@"; rc=$? ;;
        egress) op_egress "$@"; rc=$? ;;
        links)  op_links  "$@"; rc=$? ;;
        routes) op_routes "$@"; rc=$? ;;
        *)      err "unknown op: $OP"; rc=1 ;;
    esac
    case "$rc" in 0) status="OK" ;; 1) status="WARN" ;; *) status="FAIL" ;; esac
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
