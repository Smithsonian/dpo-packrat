#!/bin/bash
#
# lib/common.sh - shared helpers for Packrat server_ops scripts
#
# Sourced by: ops_database.sh, ops_logs.sh, ops_disk.sh, etc.
# Not meant to be executed directly.
#
# Provides:
#   UI       : banner, hr, log, note, warn, err, is_tty
#   Prompts  : confirm, confirm_danger, normalize_env, select_env_interactive
#   Safety   : require_cmd, init_traps, register_tmp_file, with_lock
#   Audit    : audit_log, print_summary
#
# Global variables (exported / managed):
#   ENVIRONMENT, ENV_LABEL, SCRIPT_START_EPOCH, INTERRUPTED, TMP_FILES,
#   OPS_SCRIPT_NAME, OPS_CURRENT_OP
#
# Callers should set OPS_CURRENT_OP before running an op, so audit_log
# captures which subcommand ran:
#     OPS_CURRENT_OP="backup"
#

# Idempotent sourcing guard
if [[ -n "${__PACKRAT_LIB_COMMON_SOURCED:-}" ]]; then
    return 0
fi
__PACKRAT_LIB_COMMON_SOURCED=1

# ---------------------------------------------------------------------------
# Sibling .env loader
# ---------------------------------------------------------------------------
#
# Optional sibling .env in the script root (parent of lib/) provides paths
# and credentials decoupled from the application's .env.prod/.env.dev.
# Loaded once, before the constants below resolve their defaults, so any
# ${VAR:-default} pattern in the ops scripts can be overridden via this file.
#
# Lookup order:
#   1. $OPS_ENV_FILE              (explicit override)
#   2. $HERE/../.env              (sibling of lib/, i.e., script root)
#
# Parser is intentionally restrictive: KEY=VALUE lines only, surrounding
# quotes stripped, comments and blanks ignored, no shell interpolation,
# no `source`. Process-environment values win - the file fills gaps only.

OPS_ENV_FILE_USED=""

__load_ops_env_file() {
    local lib_dir env_file line key value
    lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    env_file="${OPS_ENV_FILE:-$lib_dir/../.env}"
    [[ -f "$env_file" ]] || return 0

    while IFS= read -r line || [[ -n "$line" ]]; do
        line="${line%$'\r'}"
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        [[ "$line" != *=* ]] && continue
        key="${line%%=*}"
        value="${line#*=}"
        key="${key#"${key%%[![:space:]]*}"}"
        key="${key%"${key##*[![:space:]]}"}"
        value="${value%\"}"; value="${value#\"}"
        value="${value%\'}"; value="${value#\'}"
        if [[ -z "${!key:-}" ]]; then
            export "$key=$value"
        fi
    done < "$env_file"

    OPS_ENV_FILE_USED="$env_file"
}

__load_ops_env_file

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Transient/intermediate file root. Mirrors the original FS layout under a
# single non-system mount so /tmp, /var, /home stay clean. Every ops script
# that creates temp files, lock files, audit logs, or in-place backups
# resolves its path under this root by default.
OPS_TRANSIENT_ROOT="${OPS_TRANSIENT_ROOT:-/staging/tmp/system}"

# Try to provision the transient tmpdir. On hosts where the root doesn't
# exist (developer workstations without /staging mounted), this silently
# fails and we leave $TMPDIR alone so the system default (/tmp) keeps
# working. Production hosts have /staging, so the export takes effect.
if mkdir -p "$OPS_TRANSIENT_ROOT/tmp" 2>/dev/null; then
    # Route every consumer of $TMPDIR (mktemp, Docker BuildKit, openssl
    # scratch, ...) into the transient root, so we don't have to touch
    # each call site. Only override if the caller hasn't pinned one.
    export TMPDIR="${TMPDIR:-$OPS_TRANSIENT_ROOT/tmp}"
fi

OPS_AUDIT_LOG="${OPS_AUDIT_LOG:-$OPS_TRANSIENT_ROOT/var/log/packrat-ops.log}"
OPS_LOCK_DIR="${OPS_LOCK_DIR:-$OPS_TRANSIENT_ROOT/var/lock/packrat-ops}"
OPS_AUDIT_MAX_BYTES="${OPS_AUDIT_MAX_BYTES:-52428800}"   # 50 MB

# Containers that must NEVER be stopped/removed automatically in prod.
# Used by ops_container.sh as a safety gate. Edit here, not in each caller.
PROTECTED_PROD_CONTAINERS=("packrat-solr-prod")

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------

ENVIRONMENT="${ENVIRONMENT:-}"
ENV_LABEL="${ENV_LABEL:-}"
SCRIPT_START_EPOCH="${SCRIPT_START_EPOCH:-$(date +%s)}"
INTERRUPTED="${INTERRUPTED:-0}"
TMP_FILES=()
OPS_CURRENT_OP="${OPS_CURRENT_OP:-}"

# Best-effort script name for audit log (caller's script, since we're sourced)
if [[ -z "${OPS_SCRIPT_NAME:-}" ]]; then
    OPS_SCRIPT_NAME="$(basename "${0:-unknown}")"
fi

# ---------------------------------------------------------------------------
# TTY detection
# ---------------------------------------------------------------------------

is_tty() {
    # When OPS_USE_COLOR is set (typically captured once at script entry,
    # before any pipelines/subshells mask the TTY), honor it. Otherwise
    # fall back to a live check on stdout. Pipelines like
    #     tail -F | while read; do process_line; done
    # and command substitutions like  level=$(colorize_level ...)  both
    # detach stdout, so a naive [[ -t 1 ]] inside helpers reports false
    # even when the script itself is running in a terminal.
    if [[ -n "${OPS_USE_COLOR:-}" ]]; then
        [[ "$OPS_USE_COLOR" == "1" ]]
    else
        [[ -t 1 ]]
    fi
}

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

hr() {
    echo "-----------------------------------------------------"
}

banner() {
    local text="$1"
    echo ""
    echo "====================================================="
    echo "$text"
    echo "====================================================="
}

log() {
    echo "$*"
}

note() {
    echo "[note] $*"
}

warn() {
    echo "[warn] $*" >&2
}

err() {
    echo "[error] $*" >&2
}

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

# y/N prompt; returns 0 on yes, 1 otherwise.
confirm() {
    local prompt="$1"
    local reply
    read -r -p "$prompt [y/N]: " reply
    [[ "$reply" =~ ^[Yy]$ ]]
}

# Requires typing `yes` in full. For destructive / irreversible ops.
confirm_danger() {
    local prompt="$1"
    local reply
    echo ""
    echo "*** DANGEROUS OPERATION ***"
    echo "$prompt"
    echo "To proceed, type 'yes' in full (anything else cancels)."
    read -r -p "> " reply
    [[ "$reply" == "yes" ]]
}

# ---------------------------------------------------------------------------
# Environment normalization
# ---------------------------------------------------------------------------
#
# Accepts: 1, 2, prod, production, PROD, staging, stage, dev, etc.
# Sets    : ENVIRONMENT ("prod"|"staging"), ENV_LABEL ("PRODUCTION"|"STAGING").
# Returns : 0 on success, 1 on unrecognized input.

normalize_env() {
    local raw="${1:-}"
    case "$raw" in
        1|prod|production|PROD|PRODUCTION|Prod|Production)
            ENVIRONMENT="prod"
            ENV_LABEL="PRODUCTION"
            return 0
            ;;
        2|staging|stage|dev|STAGING|STAGE|DEV|Staging|Stage|Dev)
            ENVIRONMENT="staging"
            ENV_LABEL="STAGING"
            return 0
            ;;
        *)
            err "unknown environment: '$raw' (use: prod | staging)"
            return 1
            ;;
    esac
}

select_env_interactive() {
    echo ""
    echo "[1] Production"
    echo "[2] Staging"
    local choice
    read -r -p "Environment: " choice
    if ! normalize_env "$choice"; then
        exit 1
    fi
}

# ---------------------------------------------------------------------------
# Command availability
# ---------------------------------------------------------------------------

require_cmd() {
    local missing=()
    local cmd
    for cmd in "$@"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing+=("$cmd")
        fi
    done
    if (( ${#missing[@]} > 0 )); then
        err "missing required command(s): ${missing[*]}"
        err "install them and retry"
        return 127
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Signal traps + temp file cleanup
# ---------------------------------------------------------------------------

register_tmp_file() {
    local path="$1"
    [[ -n "$path" ]] && TMP_FILES+=("$path")
}

__ops_cleanup() {
    # Iterate defensively - empty array under set -u would otherwise error.
    if (( ${#TMP_FILES[@]} == 0 )); then
        return 0
    fi
    local f
    for f in "${TMP_FILES[@]}"; do
        if [[ -n "$f" && -e "$f" ]]; then
            echo ""
            echo "Cleaning up partial file: $f"
            rm -rf "$f" 2>/dev/null || true
        fi
    done
}

__ops_on_interrupt() {
    INTERRUPTED=1
    echo ""
    echo "*** Interrupted. Cleaning up... ***"
    __ops_cleanup
    print_summary "INTERRUPTED"
    exit 130
}

init_traps() {
    trap __ops_on_interrupt INT TERM
    trap __ops_cleanup EXIT
}

# ---------------------------------------------------------------------------
# Concurrency lock (flock)
# ---------------------------------------------------------------------------
#
# Usage: with_lock <name> -- cmd args...
#
# Non-blocking by default. If the lock is already held, prints a skipping
# message and returns 75 (EX_TEMPFAIL). Makes cron tick overlaps cleanly
# no-op instead of queueing or producing two concurrent writers.
#
# Lock file: $OPS_LOCK_DIR/<name>.lock
# If $OPS_LOCK_DIR isn't writable, falls back to $OPS_TRANSIENT_ROOT/tmp/packrat-ops-locks.

with_lock() {
    local name="$1"; shift
    if [[ "${1:-}" == "--" ]]; then shift; fi

    # On production (and any Linux server) flock is a standard binary. On
    # developer workstations (git-bash / macOS default) it may be missing,
    # in which case we warn once and run unlocked. Production cron entries
    # should pair this with a preflight `require_cmd flock` if strict
    # single-writer semantics are required.
    if ! command -v flock >/dev/null 2>&1; then
        if [[ -z "${__OPS_FLOCK_WARNED:-}" ]]; then
            warn "flock not available - running '$name' without a lock (dev only)"
            __OPS_FLOCK_WARNED=1
        fi
        "$@"
        return $?
    fi

    if [[ ! -d "$OPS_LOCK_DIR" ]]; then
        if ! mkdir -p "$OPS_LOCK_DIR" 2>/dev/null; then
            OPS_LOCK_DIR="$OPS_TRANSIENT_ROOT/tmp/packrat-ops-locks"
            mkdir -p "$OPS_LOCK_DIR"
        fi
    fi

    local lock_file="$OPS_LOCK_DIR/${name}.lock"

    # Run the work in a subshell so fd 9 is released cleanly on any exit.
    (
        exec 9>"$lock_file"
        if ! flock -n 9; then
            local holder_pid
            holder_pid=$(cat "$lock_file" 2>/dev/null || echo "?")
            err "operation already running (pid: ${holder_pid:-?}) - skipping: $name"
            exit 75
        fi
        # Record pid for diagnostics once the lock is ours.
        echo $$ > "$lock_file"
        "$@"
    )
}

# ---------------------------------------------------------------------------
# Audit trail + summary
# ---------------------------------------------------------------------------
#
# audit_log writes ONE line to $OPS_AUDIT_LOG per invocation:
#   timestamp | host | user | script | env | op | status | elapsed
#
# print_summary prints the end-of-run block and calls audit_log as a
# side effect, so scripts only need a single call per exit path.

audit_log() {
    local status="$1"
    local now
    now=$(date +%s)
    local elapsed=$(( now - SCRIPT_START_EPOCH ))
    local ts
    ts=$(date '+%Y-%m-%dT%H:%M:%S%z')
    local host user script env op line
    host="$(hostname 2>/dev/null || echo '?')"
    user="$(whoami 2>/dev/null || echo '?')"
    script="${OPS_SCRIPT_NAME:-unknown}"
    env="${ENVIRONMENT:-n/a}"
    op="${OPS_CURRENT_OP:-n/a}"
    line="${ts} | ${host} | ${user} | ${script} | ${env} | ${op} | ${status} | ${elapsed}s"

    # Ensure the audit log directory exists. The default path lives under
    # $OPS_TRANSIENT_ROOT, which may not have been provisioned on a fresh host.
    local audit_dir
    audit_dir="$(dirname -- "$OPS_AUDIT_LOG")"
    [[ -d "$audit_dir" ]] || mkdir -p "$audit_dir" 2>/dev/null || true

    # Single-step size cap. When the audit log exceeds OPS_AUDIT_MAX_BYTES,
    # rotate to .1 (overwriting any prior .1). Cheap, no logrotate dependency.
    if [[ -f "$OPS_AUDIT_LOG" ]]; then
        local cur_size
        cur_size="$(stat -c %s -- "$OPS_AUDIT_LOG" 2>/dev/null || echo 0)"
        if (( cur_size > OPS_AUDIT_MAX_BYTES )); then
            mv -f -- "$OPS_AUDIT_LOG" "${OPS_AUDIT_LOG}.1" 2>/dev/null || true
        fi
    fi

    # Best-effort append. If unwritable (dev workstation, perms, etc.),
    # emit to stderr instead of failing the op.
    if ! echo "$line" >> "$OPS_AUDIT_LOG" 2>/dev/null; then
        echo "[audit-log-unwritable] $line" >&2
    fi
}

print_summary() {
    local status="$1"
    local now
    now=$(date +%s)
    local elapsed=$(( now - SCRIPT_START_EPOCH ))
    local mins=$(( elapsed / 60 ))
    local secs=$(( elapsed % 60 ))
    echo ""
    hr
    echo "STATUS   : $status"
    echo "ENV      : ${ENV_LABEL:-n/a}"
    echo "DATABASE : ${DB_NAME:-n/a}"
    echo "ELAPSED  : ${mins}m ${secs}s"
    hr
    audit_log "$status"
}

# ---------------------------------------------------------------------------
# Interactive menu helpers
# ---------------------------------------------------------------------------
#
# Pattern: each domain script wraps its main_menu in a `while :; do … done`
# loop. main_menu returns one of:
#   0                = redraw menu (continue loop)
#   $MENU_RC_BACK    = exit script normally (return to dispatcher / shell)
#   $MENU_RC_QUIT    = exit script and signal dispatcher to also exit
#
# The dispatcher (ops_menu.sh, interactive path) detects $MENU_RC_QUIT
# from the script's exit code and propagates the quit upward.

MENU_RC_BACK=11
MENU_RC_QUIT=22

# menu_translate_exit <rc>
# Domain scripts call this on the way to `exit`. When invoked directly
# from the shell (no dispatcher), MENU_RC_QUIT is translated to 0 so
# the operator's prompt sees a clean exit. When invoked via the
# dispatcher (OPS_INVOKED_FROM_DISPATCHER=1), the raw MENU_RC_QUIT is
# preserved so the dispatcher can detect operator-Q and propagate it.
menu_translate_exit() {
    local rc="${1:-0}"
    if (( rc == MENU_RC_QUIT )) && [[ -z "${OPS_INVOKED_FROM_DISPATCHER:-}" ]]; then
        printf '0'
    else
        printf '%d' "$rc"
    fi
}

# menu_keepalive
# After an interactive [Q], park the terminal on `tail -f /dev/null`
# instead of returning to the shell. The Packrat servers have aggressive
# SSH idle timeouts and an operator who steps away for a minute should
# not have to re-authenticate. Ctrl+C breaks out and exits the script.
# TTY-only - cron / piped invocations skip the park entirely.
menu_keepalive() {
    [[ -t 0 && -t 1 ]] || return 0
    # Swap the script's loud INT trap for a quiet exit - here Ctrl+C is
    # the operator's intentional way out, not an abort that needs the
    # "Cleaning up..." banner or an INTERRUPTED audit row.
    trap 'echo ""; exit 0' INT
    echo ""
    echo "Session parked. Press Ctrl+C to reach the shell."
    # tail -f /dev/null blocks indefinitely without producing output.
    # Foreground SIGINT kills tail, the trap above fires, script exits 0.
    tail -f /dev/null
}

# menu_clear - clear the screen for a fresh menu draw. TTY-only.
menu_clear() {
    [[ -t 1 ]] && clear 2>/dev/null
}

# menu_pause [rc] - "Press Enter to return / [Q] to quit" prompt.
# Returns 0 to continue the loop, 1 if the operator chose Q.
# Always returns 0 when stdin is not a TTY (cron path).
menu_pause() {
    local rc="${1:-0}"
    [[ -t 0 ]] || return 0
    echo ""
    if (( rc == 0 )); then
        echo "--- op finished (OK) ---"
    else
        echo "--- op finished (rc=$rc) ---"
    fi
    local ans
    read -r -p "Press Enter for menu, [Q] to quit: " ans
    case "$ans" in [Qq]) return 1 ;; esac
    return 0
}

# run_op <fn> [args...] - call an op function inside a menu loop.
# Captures rc, writes a per-op audit line (so each menu choice gets its
# own audit row, not just one per session), and pauses for the operator.
# Returns the return code of menu_pause: 0 = continue, 1 = quit.
run_op() {
    "$@"
    local op_rc=$?
    if (( op_rc == 0 )); then
        audit_log "OK"
    else
        audit_log "FAIL"
    fi
    menu_pause "$op_rc"
}
