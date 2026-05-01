#!/bin/bash
#
# ops_container.sh - Packrat container operations
#
# Replaces: ops_container.sh (old), ops_deployment.sh
#
# Usage:
#   ./ops_container.sh                              # fully interactive
#   ./ops_container.sh <op> [args...]               # non-interactive
#   ./ops_container.sh <env> <op> [args...]         # env-first form
#
# env tokens : 1 | 2 | prod | production | staging | stage | dev
#
# Subcommands:
#   status    [env]                                 # docker ps -a filtered by -prod$/-dev$
#   start     <env> [container-id]
#   stop      <env> [container-id]
#   restart   <env> [container-id]
#   service   <status|restart>                      # systemd docker service
#   reclaim   [--cache]                             # container/image/volume/network prune
#                                                   # --cache also prunes builder cache
#   pre-deploy <env> [--user <u>] [--clean-cache] [--remount-tmp]
#                                                   # stop/remove containers + volumes +
#                                                   # images scoped to env suffix;
#                                                   # optional builder-cache prune;
#                                                   # optional /tmp remount exec
#
# Safety:
#   - stop / restart / pre-deploy refuse to touch any container whose name
#     matches $PROTECTED_PROD_CONTAINERS (defined in lib/common.sh).
#   - reclaim and pre-deploy wrap their work in with_lock - concurrent
#     cron ticks cleanly skip instead of racing.
#   - No container-id given on stop/restart -> list candidates and prompt.
#     In non-TTY mode, refuse (prevents cron mishaps).
#
# Examples:
#   ./ops_container.sh status prod
#   ./ops_container.sh prod stop packrat-server-prod
#   ./ops_container.sh reclaim
#   ./ops_container.sh reclaim --cache
#   ./ops_container.sh pre-deploy dev --user jenkins --clean-cache
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_container.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"

init_traps

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Container-naming suffix for the selected env. "Production" uses -prod,
# everything else uses -dev (the staging box runs the dev suffix too).
env_suffix() {
    case "$ENVIRONMENT" in
        prod)    echo "-prod" ;;
        staging) echo "-dev"  ;;
        *) err "env_suffix: bad ENVIRONMENT='$ENVIRONMENT'"; return 1 ;;
    esac
}

env_dirname() {
    case "$ENVIRONMENT" in
        prod)    echo "Production" ;;
        staging) echo "Staging"    ;;
        *) err "env_dirname: bad ENVIRONMENT='$ENVIRONMENT'"; return 1 ;;
    esac
}

# List packrat containers for the selected env suffix, one per line.
# Filters out any name in $PROTECTED_PROD_CONTAINERS when env is prod.
# $1 (optional) = "all" to skip the protected filter (used by `status`,
# which should still surface protected names for visibility).
list_env_containers() {
    local mode="${1:-}"
    local suffix
    suffix="$(env_suffix)"
    local list
    list=$(docker ps -a --format '{{.Names}}' 2>/dev/null \
           | grep -E "^packrat-.*${suffix}\$" || true)
    if [[ "$mode" == "all" || "$ENVIRONMENT" != "prod" ]]; then
        printf '%s\n' "$list"
        return 0
    fi
    # Production: strip any protected container names from the list.
    local pattern protected c
    pattern=""
    for c in "${PROTECTED_PROD_CONTAINERS[@]}"; do
        pattern+="${pattern:+|}^${c}\$"
    done
    if [[ -z "$pattern" ]]; then
        printf '%s\n' "$list"
        return 0
    fi
    printf '%s\n' "$list" | grep -Ev "$pattern" || true
}

# Returns 0 if $1 is in PROTECTED_PROD_CONTAINERS, 1 otherwise.
is_protected_container() {
    local target="$1"
    local c
    for c in "${PROTECTED_PROD_CONTAINERS[@]}"; do
        [[ "$c" == "$target" ]] && return 0
    done
    return 1
}

# Enforce the protected-container gate on prod-only. Returns 0 if safe to
# proceed, non-zero + prints an error otherwise.
guard_protected() {
    local target="$1"
    if [[ "$ENVIRONMENT" == "prod" ]] && is_protected_container "$target"; then
        err "refusing to touch protected production container: $target"
        err "edit PROTECTED_PROD_CONTAINERS in lib/common.sh if this is intentional"
        return 1
    fi
    return 0
}

# Prompt the operator to pick one of the listed containers. Echoes the
# chosen name on stdout (empty if cancelled).
prompt_for_container() {
    local -a names=()
    local line
    while IFS= read -r line; do
        [[ -n "$line" ]] && names+=("$line")
    done
    if (( ${#names[@]} == 0 )); then
        err "no packrat containers found for $ENV_LABEL"
        return 1
    fi
    echo "" >&2
    echo "Candidates:" >&2
    local i
    for (( i=0; i<${#names[@]}; i++ )); do
        printf "  [%d] %s\n" $((i+1)) "${names[i]}" >&2
    done
    local choice
    read -r -p "Select (number or full name, blank to cancel): " choice
    [[ -z "$choice" ]] && { err "cancelled"; return 1; }
    if [[ "$choice" =~ ^[0-9]+$ ]]; then
        local idx=$((choice-1))
        if (( idx < 0 || idx >= ${#names[@]} )); then
            err "out of range: $choice"
            return 1
        fi
        printf '%s\n' "${names[idx]}"
    else
        printf '%s\n' "$choice"
    fi
}

# ---------------------------------------------------------------------------
# Operation: status
# ---------------------------------------------------------------------------

op_status() {
    OPS_CURRENT_OP="status"
    require_cmd docker || return 127

    # If env wasn't provided, show all packrat containers.
    if [[ -z "${ENVIRONMENT:-}" ]]; then
        banner "CONTAINER STATUS (all packrat-*)"
        docker ps -a --filter "name=packrat-"
        return 0
    fi

    banner "CONTAINER STATUS ($ENV_LABEL)"
    local suffix
    suffix="$(env_suffix)"
    # Use grep (not --filter name=) so the match is anchored at end-of-
    # name: --filter name= is a substring match and would include e.g.
    # -prod-thing-else.
    local names
    names=$(docker ps -a --format '{{.Names}}' 2>/dev/null \
            | grep -E "^packrat-.*${suffix}\$" || true)
    if [[ -z "$names" ]]; then
        note "no containers match 'packrat-*${suffix}'"
        return 0
    fi
    # Render with the standard columns. Pipe the name list through a
    # filter on the full ps -a output to preserve formatting.
    docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' \
        | awk -v names="$names" '
            BEGIN { split(names, arr, "\n"); for (i in arr) keep[arr[i]]=1 }
            NR==1 { print; next }
            $1 in keep { print }
        '
}

# ---------------------------------------------------------------------------
# Operation: start | stop | restart
# ---------------------------------------------------------------------------

op_docker_action() {
    local action="$1"; shift
    OPS_CURRENT_OP="$action"
    require_cmd docker || return 127

    if [[ -z "${ENVIRONMENT:-}" ]]; then
        select_env_interactive
    fi

    local container="${1:-}"
    if [[ -z "$container" ]]; then
        if ! [[ -t 0 ]]; then
            err "$action requires a container id in non-interactive mode"
            return 1
        fi
        # Surface all candidates (including protected ones) so the
        # operator can see what's there. The guard below still blocks
        # destructive actions on protected names.
        local list
        list=$(list_env_containers all)
        container=$(printf '%s\n' "$list" | prompt_for_container) || return 1
    fi

    # Protected-container gate for stop/restart. start is not gated -
    # starting a stopped solr is fine.
    if [[ "$action" != "start" ]]; then
        guard_protected "$container" || return 1
    fi

    banner "${action^^} CONTAINER ($ENV_LABEL)"
    echo "Container: $container"
    docker "$action" "$container"
}

op_start()   { op_docker_action start   "$@"; }
op_stop()    { op_docker_action stop    "$@"; }
op_restart() { op_docker_action restart "$@"; }

# ---------------------------------------------------------------------------
# Operation: service (systemd docker)
# ---------------------------------------------------------------------------

op_service() {
    OPS_CURRENT_OP="service"
    require_cmd systemctl || return 127

    local sub="${1:-}"
    if [[ -z "$sub" ]]; then
        echo "[1] status"
        echo "[2] restart"
        local c
        read -r -p "Choose: " c
        case "$c" in
            1) sub="status" ;;
            2) sub="restart" ;;
            *) err "invalid choice"; return 1 ;;
        esac
    fi

    case "$sub" in
        status)
            banner "DOCKER SERVICE STATUS"
            sudo systemctl status docker
            ;;
        restart)
            banner "RESTART DOCKER SERVICE"
            if [[ -t 0 ]]; then
                if ! confirm "Restart docker on $(hostname)?"; then
                    echo "Cancelled."
                    return 1
                fi
            fi
            sudo systemctl restart docker
            echo "done"
            ;;
        *)
            err "unknown service op: $sub (use status|restart)"
            return 1
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Operation: reclaim
# ---------------------------------------------------------------------------

op_reclaim() {
    OPS_CURRENT_OP="reclaim"
    local clean_cache=false
    while (( $# > 0 )); do
        case "$1" in
            --cache|-c) clean_cache=true ;;
            -h|--help)
                echo "usage: ops_container.sh reclaim [--cache]"
                return 0
                ;;
            *) err "reclaim: unknown arg '$1'"; return 1 ;;
        esac
        shift
    done

    require_cmd docker || return 127

    with_lock "container-reclaim" -- __reclaim_run "$clean_cache"
}

__reclaim_run() {
    local clean_cache="$1"

    banner "DOCKER RECLAIM SPACE"
    echo "Builder cache : $( $clean_cache && echo 'WILL be pruned (--cache)' || echo 'will be preserved (pass --cache to prune)' )"
    echo ""

    hr
    echo "space use: pre-cleanup"
    hr
    docker system df || true
    echo ""

    hr
    echo "pruning..."
    hr
    # Stopped containers (not running)
    docker container prune -f || true
    # Dangling (untagged) images only - do NOT pass -a so tagged unused
    # images survive. Matches the 'conservative' default in the plan.
    docker image prune -f || true
    # Volumes with no linked containers
    docker volume prune -f || true
    # Networks with no linked containers
    docker network prune -f || true

    if [[ "$clean_cache" == "true" ]]; then
        echo ""
        echo "pruning builder cache (--cache)..."
        docker builder prune -a -f || true
    fi

    echo ""
    hr
    echo "space use: post-cleanup"
    hr
    docker system df || true
}

# ---------------------------------------------------------------------------
# Operation: pre-deploy (env-scoped cleanup)
# ---------------------------------------------------------------------------

op_predeploy() {
    OPS_CURRENT_OP="pre-deploy"
    local deploy_user=""
    local clean_cache=false
    local remount_tmp=false

    # env may already be set via the leading env token; the flag parser
    # below is agnostic to that.
    while (( $# > 0 )); do
        case "$1" in
            -u|--user)       deploy_user="${2:-}"; shift 2; continue ;;
            --user=*)        deploy_user="${1#--user=}" ;;
            -c|--clean-cache) clean_cache=true ;;
            --remount-tmp)   remount_tmp=true ;;
            -h|--help)
                echo "usage: ops_container.sh pre-deploy <env> [--user <u>] [--clean-cache] [--remount-tmp]"
                return 0
                ;;
            *)
                # Allow env token here too for older invocation habits
                case "$1" in
                    1|2|prod|production|PROD|PRODUCTION|Prod|Production|\
                    staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
                        normalize_env "$1" >/dev/null
                        ;;
                    *)
                        err "pre-deploy: unknown arg '$1'"
                        return 1
                        ;;
                esac
                ;;
        esac
        shift
    done

    if [[ -z "${ENVIRONMENT:-}" ]]; then
        if [[ -t 0 ]]; then
            select_env_interactive
        else
            err "pre-deploy requires <env> in non-interactive mode"
            return 1
        fi
    fi

    if [[ -z "$deploy_user" ]]; then
        if [[ -t 0 ]]; then
            read -r -p "Enter username for temp files (default: $USER): " input_user
            deploy_user="${input_user:-$USER}"
        else
            deploy_user="$USER"
        fi
    fi

    require_cmd docker grep awk sort || return 127

    with_lock "container-predeploy-${ENVIRONMENT}" -- \
        __predeploy_run "$deploy_user" "$clean_cache" "$remount_tmp"
}

__predeploy_run() {
    local deploy_user="$1"
    local clean_cache="$2"
    local remount_tmp="$3"
    local suffix
    suffix="$(env_suffix)"
    local env_name
    env_name="$(env_dirname)"

    banner "PRE-DEPLOY ($env_name / suffix=$suffix)"
    echo "Deploy user  : $deploy_user"
    echo "Clean cache  : $clean_cache"
    echo "Remount /tmp : $remount_tmp"
    echo ""

    # 1. Target container list (honors protected-container gate on prod)
    local container_list
    container_list=$(list_env_containers)
    if [[ -z "$container_list" ]]; then
        note "no target containers found matching 'packrat-*${suffix}' (after protected filter)"
    else
        echo "Target containers:"
        printf '%s\n' "$container_list" | sed 's/^/  - /'
    fi
    echo ""

    # 2. Capture named volumes attached to those containers BEFORE removal
    local env_volumes=""
    if [[ -n "$container_list" ]]; then
        note "identifying named volumes on target containers..."
        env_volumes=$(printf '%s\n' "$container_list" \
            | xargs -r docker inspect \
                -f '{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}}{{"\n"}}{{end}}{{end}}' \
                2>/dev/null \
            | sort -u || true)
    fi

    # 3. Stop + remove containers (also anonymous volumes via -v)
    if [[ -n "$container_list" ]]; then
        note "stopping containers..."
        printf '%s\n' "$container_list" | xargs -r docker stop || true
        note "removing containers (with anonymous volumes)..."
        printf '%s\n' "$container_list" | xargs -r docker rm -f -v || true
    fi

    # 4. Remove captured named volumes if they're no longer referenced
    if [[ -n "$env_volumes" ]]; then
        note "checking captured named volumes..."
        local v
        while IFS= read -r v; do
            [[ -z "$v" ]] && continue
            if [[ -z "$(docker ps -aq --filter "volume=$v" 2>/dev/null)" ]]; then
                echo "removing unused volume: $v"
                docker volume rm "$v" >/dev/null 2>&1 || true
            else
                echo "skipping volume (in use): $v"
            fi
        done <<< "$env_volumes"
    else
        note "no named volumes to clean"
    fi

    # 5. Remove env-scoped images
    note "removing images matching 'packrat-*${suffix}'..."
    local images_to_remove
    images_to_remove=$(docker images --format '{{.Repository}} {{.ID}}' 2>/dev/null \
        | grep -E "^packrat-.*${suffix}" \
        | awk '{print $2}' | sort -u || true)

    # Staging includes solr images (they're safe to rebuild on dev)
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        local solr_imgs
        solr_imgs=$(docker images --format '{{.Repository}} {{.ID}}' 2>/dev/null \
            | grep "packrat-solr" | awk '{print $2}' || true)
        if [[ -n "$solr_imgs" ]]; then
            images_to_remove="$images_to_remove"$'\n'"$solr_imgs"
        fi
    fi

    # Filter out empties and dedupe
    images_to_remove=$(printf '%s\n' "$images_to_remove" | awk 'NF' | sort -u)
    if [[ -n "$images_to_remove" ]]; then
        printf '%s\n' "$images_to_remove" | xargs -r docker rmi -f || true
    else
        note "no env-scoped images found"
    fi

    # 6. Dangling images + unused networks (always safe)
    note "pruning dangling images..."
    docker image prune -f || true
    note "pruning unused networks..."
    docker network prune -f || true

    # 7. Optional builder cache prune
    if [[ "$clean_cache" == "true" ]]; then
        note "pruning builder cache (--clean-cache)..."
        docker builder prune -a -f || true
    else
        note "skipping build cache (pass --clean-cache to prune)"
    fi

    # 8. Optional /tmp remount (only hosts with /tmp mounted noexec need this)
    if [[ "$remount_tmp" == "true" ]]; then
        note "remounting /tmp with exec (--remount-tmp)..."
        local tmpdir="/home/${deploy_user}/tmp"
        export TMPDIR="$tmpdir"
        if [[ ! -d "$tmpdir" ]]; then
            mkdir -p "$tmpdir"
            chown "$deploy_user" "$tmpdir" 2>/dev/null || true
        fi
        sudo mount /tmp -o remount,exec
        echo "/tmp remounted."
    fi

    echo ""
    echo "Pre-deploy complete."
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    banner "PACKRAT CONTAINER OPS"
    echo "[1] Status              Read-only. Always safe."
    echo "[2] Start               Bring a stopped container up. Not gated."
    echo "[3] Stop                !! Brief downtime for the named container."
    echo "                           Protected prod containers refused (edit"
    echo "                           PROTECTED_PROD_CONTAINERS in lib/common.sh to override)."
    echo "[4] Restart             !! Same downtime as stop; same prod-protection gate."
    echo "[5] Service status      Read-only systemctl status."
    echo "[6] Service restart     !! Bounces the docker daemon = ALL containers on"
    echo "                           this host. Planned windows only."
    echo "[7] Reclaim space       Prunes dangling images, stopped containers, unused"
    echo "                           volumes/networks. Safe anytime; running stuff untouched."
    echo "                           --cache also wipes BuildKit cache (slower next build)."
    echo "[8] Pre-deploy          !! Stops + removes target env's containers, removes"
    echo "                           their images and unused volumes. Use ONLY before"
    echo "                           a real deploy - not a routine reclaim."
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1)    run_op op_status         || return $MENU_RC_QUIT ;;
        2)    run_op op_start          || return $MENU_RC_QUIT ;;
        3)    run_op op_stop           || return $MENU_RC_QUIT ;;
        4)    run_op op_restart        || return $MENU_RC_QUIT ;;
        5)    run_op op_service status || return $MENU_RC_QUIT ;;
        6)    run_op op_service restart|| return $MENU_RC_QUIT ;;
        7)    run_op op_reclaim        || return $MENU_RC_QUIT ;;
        8)    run_op op_predeploy      || return $MENU_RC_QUIT ;;
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
    sed -n '2,45p' "$0"
}

case "${1:-}" in
    -h|--help) print_help; exit 0 ;;
esac

# If arg 1 is a recognized env token, normalize and consume it.
case "${1:-}" in
    1|2|prod|production|PROD|PRODUCTION|Prod|Production|\
    staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
        normalize_env "$1" >/dev/null
        shift
        ;;
esac

OP="${1:-}"
[[ -n "$OP" ]] && shift

# Some ops accept the env as their first positional arg. If env still
# unset after the leading-token consumption, and the op is one that
# needs env, capture it from $1.
case "$OP" in
    start|stop|restart|pre-deploy)
        if [[ -z "${ENVIRONMENT:-}" && -n "${1:-}" ]]; then
            case "$1" in
                1|2|prod|production|PROD|PRODUCTION|Prod|Production|\
                staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
                    normalize_env "$1" >/dev/null
                    shift
                    ;;
            esac
        fi
        ;;
    status)
        # env optional; capture if present but don't prompt
        if [[ -z "${ENVIRONMENT:-}" && -n "${1:-}" ]]; then
            case "$1" in
                1|2|prod|production|PROD|PRODUCTION|Prod|Production|\
                staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
                    normalize_env "$1" >/dev/null
                    shift
                    ;;
            esac
        fi
        ;;
esac

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
        status)     op_status     "$@" || rc=$? ;;
        start)      op_start      "$@" || rc=$? ;;
        stop)       op_stop       "$@" || rc=$? ;;
        restart)    op_restart    "$@" || rc=$? ;;
        service)    op_service    "$@" || rc=$? ;;
        service-status)  op_service status  "$@" || rc=$? ;;
        service-restart) op_service restart "$@" || rc=$? ;;
        reclaim)    op_reclaim    "$@" || rc=$? ;;
        pre-deploy|predeploy|deploy)
            op_predeploy "$@" || rc=$? ;;
        *)          err "unknown op: $OP"; rc=1 ;;
    esac
    (( rc != 0 )) && status="FAIL"
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
