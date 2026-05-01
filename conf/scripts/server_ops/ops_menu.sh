#!/bin/bash
#
# ops_menu.sh - top-level dispatcher for Packrat server_ops
#
# Interactive menu + CLI router. Every domain script is a sibling of
# this file - no absolute paths, uses $HERE discovery so the whole
# `new_ops/` tree can be moved/renamed without touching this script.
#
# Usage:
#   ./ops_menu.sh                                   # interactive menu
#   ./ops_menu.sh <domain> [domain-args...]         # route to sibling
#   ./ops_menu.sh --list                            # every <domain> <op>
#   ./ops_menu.sh --help                            # one-line summary per domain
#
# Domains:
#   database   - drop | rebuild | prune | backup | optimize | metrics ...
#   logs       - tail | less | copy | backup
#   disk       - usage | disk-watch | release-deleted | monitor
#   system     - monitor | remount | perf | procinfo
#   container  - status | start | stop | restart | service | reclaim | pre-deploy
#   solr       - status | clear | reindex
#   data       - clear | backup
#   cert       - inspect | format | expiry
#
# Examples:
#   ./ops_menu.sh database prod backup /3ddigip01/Packrat/Backups/Database zip
#   ./ops_menu.sh logs prod tail
#   ./ops_menu.sh cert expiry /etc/ssl/packrat.pem --warn-days 14
#   ./ops_menu.sh --list
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_menu.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"

# init_traps so INT cleans up (the dispatch path uses `exec` and won't
# reach our summary; these traps cover the non-dispatch flows).
init_traps

# ---------------------------------------------------------------------------
# Domain registry
# ---------------------------------------------------------------------------
#
# Single source of truth for everything this dispatcher offers. Each
# entry is:   <key> | <script-basename> | <one-line description>
# Operations listed below drive `--list`; keep in sync with the
# per-script help blocks.

DOMAINS=(
    "database|ops_database.sh|MariaDB ops (backup, prune, metrics, ...)"
    "logs|ops_logs.sh|Log tail / less / copy / daily backup"
    "disk|ops_disk.sh|Disk usage / disk-watch / release-deleted / inotify monitor"
    "system|ops_system.sh|System monitor / remount / perf / procinfo"
    "container|ops_container.sh|Docker container ops + pre-deploy cleanup"
    "solr|ops_solr.sh|Solr status / clear / reindex"
    "data|ops_data.sh|Transient staging clear + repository rsync backup"
    "cert|ops_cert.sh|Certificate inspect / format / expiry"
)

DOMAIN_OPS_database="drop rebuild prune backup optimize metrics"
DOMAIN_OPS_logs="tail less copy backup"
DOMAIN_OPS_disk="usage disk-watch release-deleted monitor"
DOMAIN_OPS_system="monitor remount perf procinfo"
DOMAIN_OPS_container="status start stop restart service reclaim pre-deploy"
DOMAIN_OPS_solr="status clear reindex"
DOMAIN_OPS_data="clear backup"
DOMAIN_OPS_cert="inspect format expiry"

# Metrics expands to subops in Phase 5 (the rest are deferred). Rendered
# explicitly under --list.
DOMAIN_OPS_database_metrics="size inspect"

# ---------------------------------------------------------------------------
# Domain helpers
# ---------------------------------------------------------------------------

# Look up the script basename for a domain key. Empty + rc=1 if unknown.
domain_script() {
    local key="$1" entry k script
    for entry in "${DOMAINS[@]}"; do
        k="${entry%%|*}"
        if [[ "$k" == "$key" ]]; then
            entry="${entry#*|}"
            script="${entry%%|*}"
            printf '%s' "$script"
            return 0
        fi
    done
    return 1
}

# Look up the description for a domain key. Empty + rc=1 if unknown.
domain_desc() {
    local key="$1" entry k
    for entry in "${DOMAINS[@]}"; do
        k="${entry%%|*}"
        if [[ "$k" == "$key" ]]; then
            entry="${entry#*|}"
            printf '%s' "${entry#*|}"
            return 0
        fi
    done
    return 1
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

# Exec a domain's sibling script with the remaining args. Uses exec so
# the child process replaces us - signals and exit code pass through
# cleanly, no nested summary output.
dispatch_domain() {
    local key="$1"; shift
    local script
    if ! script=$(domain_script "$key"); then
        err "unknown domain: '$key'"
        err "see: $OPS_SCRIPT_NAME --list"
        return 1
    fi
    local path="$HERE/$script"
    if [[ ! -x "$path" ]]; then
        err "sibling script not executable or missing: $path"
        return 1
    fi
    # CLI passthrough. Once exec runs, we don't come back - the child
    # emits its own print_summary, signals reach it directly, exit code
    # is its own. Cron-friendly.
    exec "$path" "$@"
}

# Run a domain script as a child (interactive menu path). Returns the
# child's exit code so the menu loop can detect MENU_RC_QUIT (operator
# chose [Q] from inside the domain) and propagate the quit upward.
dispatch_domain_child() {
    local key="$1"; shift
    local script
    if ! script=$(domain_script "$key"); then
        err "unknown domain: '$key'"
        return 1
    fi
    local path="$HERE/$script"
    if [[ ! -x "$path" ]]; then
        err "sibling script not executable or missing: $path"
        return 1
    fi
    # OPS_INVOKED_FROM_DISPATCHER tells the child to exit with the raw
    # MENU_RC_QUIT instead of translating it to 0 - so we can detect
    # operator [Q] inside the domain and propagate the quit upward.
    OPS_INVOKED_FROM_DISPATCHER=1 "$path" "$@"
}

# ---------------------------------------------------------------------------
# --list and --help renderers
# ---------------------------------------------------------------------------

op_list() {
    OPS_CURRENT_OP="list"
    local entry key script ops op
    for entry in "${DOMAINS[@]}"; do
        key="${entry%%|*}"
        entry="${entry#*|}"
        script="${entry%%|*}"
        # shellcheck disable=SC2086
        eval "ops=\$DOMAIN_OPS_${key}"
        for op in $ops; do
            if [[ "$key" == "database" && "$op" == "metrics" ]]; then
                local sub
                for sub in $DOMAIN_OPS_database_metrics; do
                    printf '%-10s metrics %s\n' "$key" "$sub"
                done
            else
                printf '%-10s %s\n' "$key" "$op"
            fi
        done
    done
}

op_help() {
    OPS_CURRENT_OP="help"
    local entry key script desc
    echo "Packrat server_ops top-level dispatcher"
    echo ""
    echo "Usage:"
    echo "  ops_menu.sh                             # interactive menu"
    echo "  ops_menu.sh <domain> [args...]          # route to sibling"
    echo "  ops_menu.sh --list                      # every <domain> <op> combo"
    echo "  ops_menu.sh --help                      # this output"
    echo ""
    echo "Domains:"
    for entry in "${DOMAINS[@]}"; do
        key="${entry%%|*}"
        entry="${entry#*|}"
        script="${entry%%|*}"
        desc="${entry#*|}"
        printf '  %-10s %s\n' "$key" "$desc"
    done
    echo ""
    echo "Run 'ops_menu.sh <domain> --help' for per-domain usage."
}

# ---------------------------------------------------------------------------
# Interactive menu
# ---------------------------------------------------------------------------

main_menu() {
    banner "PACKRAT OPS MENU"
    echo "(per-domain menus annotate destructive ops with '!!' notes)"
    echo ""
    local i=1 entry key desc
    for entry in "${DOMAINS[@]}"; do
        key="${entry%%|*}"
        entry="${entry#*|}"
        desc="${entry#*|}"
        printf '[%d] %-11s %s\n' "$i" "${key^}" "$desc"
        i=$((i+1))
    done
    echo "[L] List all ops"
    echo "[Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        [Ll]) op_list; return 0 ;;
        [Qq]) return $MENU_RC_QUIT ;;
    esac
    if ! [[ "$c" =~ ^[0-9]+$ ]]; then
        err "invalid choice"
        return 0
    fi
    local idx=$((c - 1))
    if (( idx < 0 || idx >= ${#DOMAINS[@]} )); then
        err "out of range: $c"
        return 0
    fi
    entry="${DOMAINS[idx]}"
    key="${entry%%|*}"
    # Run as child. If the domain script exited with MENU_RC_QUIT the
    # operator hit [Q] inside it - propagate so the dispatcher also exits.
    dispatch_domain_child "$key"
    local child_rc=$?
    if (( child_rc == MENU_RC_QUIT )); then
        return $MENU_RC_QUIT
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

status="OK"
rc=0

case "${1:-}" in
    -h|--help)
        op_help
        ;;
    --list)
        op_list
        ;;
    "")
        # Interactive: loop the dispatcher menu so quitting a domain
        # script ([B] or [Q]) returns here. [Q] from inside a domain
        # propagates via MENU_RC_QUIT and exits everything.
        menu_clear
        while :; do
            main_menu
            menu_rc=$?
            case "$menu_rc" in
                "$MENU_RC_QUIT") rc=$MENU_RC_QUIT; break ;;
                *) ;;
            esac
        done
        # Top of the chain - park the session so SSH idle timeout
        # doesn't drop the operator's terminal.
        menu_keepalive
        ;;
    *)
        # CLI passthrough. Routes to sibling via exec - we do not return.
        dispatch_domain "$@" || rc=$?
        ;;
esac

# Don't print a session summary for the interactive dispatcher path -
# each child wrote its own audit lines per op via run_op. Only summary
# the CLI passthrough case (which only fires when exec failed up front).
if [[ -n "${1:-}" && "${1:-}" != --* ]]; then
    (( rc != 0 )) && status="FAIL"
    print_summary "$status"
fi

# menu_translate_exit turns operator-Q (MENU_RC_QUIT) into a clean 0
# unless we ourselves were spawned from another dispatcher (rare).
exit "$(menu_translate_exit "$rc")"
