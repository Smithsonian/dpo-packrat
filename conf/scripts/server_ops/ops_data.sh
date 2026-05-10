
#!/bin/bash
#
# ops_data.sh - Packrat transient + repository data ops
#
# Replaces: ops_data.sh (old), backup_data.sh
#
# Usage:
#   ./ops_data.sh                                   # fully interactive
#   ./ops_data.sh <env> <op> [args...]              # non-interactive
#
# env tokens : 1 | 2 | prod | production | staging | stage | dev
#
# Subcommands:
#   clear   <env> [--dry-run] [--yes]               # wipe transient staging
#   backup  <env> [dest-dir]                        # rsync repository to backup
#
# Safety:
#   - clear lists what will be deleted (count + size) before prompting.
#   - clear requires typed 'yes' via confirm_danger (or --yes for cron).
#   - --dry-run lists without deleting - safe rehearsal.
#   - All paths are quoted; no unguarded glob expansion.
#   - backup wraps its rsync in with_lock so overlapping cron ticks skip.
#
# Examples:
#   ./ops_data.sh staging clear --dry-run
#   ./ops_data.sh staging clear --yes
#   ./ops_data.sh prod backup
#   ./ops_data.sh prod backup /mnt/other/backups/
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_data.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"

init_traps

# ---------------------------------------------------------------------------
# Storage roots (top of file - adjust if layout changes)
# ---------------------------------------------------------------------------

PROD_STAGING="${PROD_STAGING:-/data/Packrat/Storage/Staging}"
STAGING_STAGING="${STAGING_STAGING:-/data/Packrat/Storage-Dev/Staging}"

PROD_REPO_SRC="${PROD_REPO_SRC:-/3ddigip01/Packrat/Storage/Repository/}"
STAGING_REPO_SRC="${STAGING_REPO_SRC:-/3ddigip01/Packrat/Storage-Dev/Repository/}"

PROD_BACKUP_DST="${PROD_BACKUP_DST:-/3ddigip01/Packrat/Backups/Repository/Production/}"
STAGING_BACKUP_DST="${STAGING_BACKUP_DST:-/3ddigip01/Packrat/Backups/Repository/Staging/}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

staging_path_for_env() {
    case "$ENVIRONMENT" in
        prod)    echo "$PROD_STAGING" ;;
        staging) echo "$STAGING_STAGING" ;;
        *) err "staging_path_for_env: bad ENVIRONMENT='$ENVIRONMENT'"; return 1 ;;
    esac
}

repo_src_for_env() {
    case "$ENVIRONMENT" in
        prod)    echo "$PROD_REPO_SRC" ;;
        staging) echo "$STAGING_REPO_SRC" ;;
        *) err "repo_src_for_env: bad ENVIRONMENT='$ENVIRONMENT'"; return 1 ;;
    esac
}

repo_dst_for_env() {
    case "$ENVIRONMENT" in
        prod)    echo "$PROD_BACKUP_DST" ;;
        staging) echo "$STAGING_BACKUP_DST" ;;
        *) err "repo_dst_for_env: bad ENVIRONMENT='$ENVIRONMENT'"; return 1 ;;
    esac
}

# Count + total size of the entries directly under $1. Prints "N  H" on
# stdout (count and human-readable size) so callers can render.
summarize_dir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        printf '0\t0\n'
        return 0
    fi
    local count
    count=$(find "$dir" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l)
    local size
    size=$(du -sh -- "$dir" 2>/dev/null | awk '{print $1}')
    printf '%s\t%s\n' "$count" "${size:-?}"
}

# ---------------------------------------------------------------------------
# Operation: clear
# ---------------------------------------------------------------------------

op_clear() {
    OPS_CURRENT_OP="clear"
    local dry_run=false
    local assume_yes=false
    while (( $# > 0 )); do
        case "$1" in
            --dry-run)  dry_run=true ;;
            --yes|-y)   assume_yes=true ;;
            -h|--help)
                echo "usage: ops_data.sh <env> clear [--dry-run] [--yes]"
                return 0
                ;;
            *) err "clear: unknown arg '$1'"; return 1 ;;
        esac
        shift
    done

    require_cmd find du awk wc || return 127

    local target
    target="$(staging_path_for_env)"

    banner "CLEAR TRANSIENT DATA ($ENV_LABEL)"
    echo "Target   : $target"
    if $dry_run;    then echo "Mode     : DRY RUN (listing only)"; fi
    if $assume_yes; then echo "Confirm  : --yes (skipping typed confirmation)"; fi
    echo ""

    if [[ ! -d "$target" ]]; then
        warn "target does not exist: $target"
        return 0
    fi

    local count size line
    line=$(summarize_dir "$target")
    count="${line%%$'\t'*}"
    size="${line##*$'\t'}"
    echo "Entries  : $count"
    echo "Size     : $size"
    echo ""

    if (( count == 0 )); then
        note "nothing to clear"
        return 0
    fi

    # Show a sample listing so operators see what's about to go
    echo "Sample (first 10 entries):"
    find "$target" -mindepth 1 -maxdepth 1 -printf '  %f\n' 2>/dev/null | head -n 10
    echo ""

    if $dry_run; then
        note "dry-run complete; nothing deleted"
        return 0
    fi

    if ! $assume_yes; then
        if ! [[ -t 0 ]]; then
            err "non-interactive and --yes not given; refusing to delete"
            return 1
        fi
        if ! confirm_danger "Delete $count entries under $target?"; then
            echo "Cancelled."
            return 1
        fi
    fi

    # Quoted, explicit path. Use find -delete so failures on a single
    # entry don't cascade via rm -rf's error-prone recursion.
    echo "Deleting..."
    find "$target" -mindepth 1 -maxdepth 1 \
        -exec rm -rf -- {} + 2>&1 | tail -n 20 || true

    # Post-check so the log records what remains
    line=$(summarize_dir "$target")
    count="${line%%$'\t'*}"
    size="${line##*$'\t'}"
    echo ""
    echo "After:   entries=$count  size=$size"
}

# ---------------------------------------------------------------------------
# Operation: backup
# ---------------------------------------------------------------------------

op_backup() {
    OPS_CURRENT_OP="backup"
    local dest="${1:-}"

    require_cmd rsync || return 127

    local src
    src="$(repo_src_for_env)"
    if [[ -z "$dest" ]]; then
        dest="$(repo_dst_for_env)"
    fi

    banner "REPOSITORY BACKUP ($ENV_LABEL)"
    echo "Source   : $src"
    echo "Dest     : $dest"

    if [[ ! -d "$src" ]]; then
        err "source does not exist: $src"
        return 1
    fi
    mkdir -p -- "$dest" || { err "cannot create dest: $dest"; return 1; }

    local dest_key
    dest_key="$(echo -n "$dest" | tr -c 'A-Za-z0-9' '-')"
    with_lock "data-backup-${ENVIRONMENT}-${dest_key}" -- \
        __backup_run "$src" "$dest"
}

__backup_run() {
    local src="$1"
    local dest="$2"
    echo ""
    hr
    echo "Syncing..."
    hr
    # --info=progress2 for a single total-progress line (less spammy than
    # the per-file output on a big repository). --archive preserves perms,
    # times, symlinks. --human-readable for readable sizes in the summary.
    time rsync -ah --info=progress2 -- "$src" "$dest"
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    menu_clear
    banner "PACKRAT DATA OPS"
    echo "Environment: $ENV_LABEL"
    echo ""
    echo "[1] Clear staging   - !! rm -rf the env's staging tree, irreversible"
    echo "[2] Backup repo     - rsync -ah to backup mount (no --delete)"
    echo ""
    echo "[B] Back to top menu     [Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1)    run_op op_clear  || return $MENU_RC_QUIT ;;
        2)    run_op op_backup || return $MENU_RC_QUIT ;;
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

case "${1:-}" in
    1|2|prod|production|PROD|PRODUCTION|Prod|Production|\
    staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
        normalize_env "$1" >/dev/null
        shift
        ;;
esac

OP="${1:-}"
[[ -n "$OP" ]] && shift

if [[ -z "${ENVIRONMENT:-}" ]]; then
    select_env_interactive
fi

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
        clear)  op_clear  "$@" || rc=$? ;;
        backup) op_backup "$@" || rc=$? ;;
        *)      err "unknown op: $OP"; rc=1 ;;
    esac
    (( rc != 0 )) && status="FAIL"
    print_summary "$status"
fi

exit "$(menu_translate_exit "$rc")"
