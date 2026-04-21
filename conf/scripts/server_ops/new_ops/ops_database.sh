#!/bin/bash
#
# ops_database.sh - Packrat database operations
#
# Replaces: ops_database_menu.sh, ops_database.sh (old), database_drop.sh,
#           backup_db.sh
#
# Interactive menu + CLI-driven DB ops for Packrat (production/staging).
# Credentials are sourced from .env.prod / .env.dev via lib/credentials.sh
# (nothing hardcoded here). Destructive ops are gated on staging-only
# and require typed confirmation or --yes.
#
# Usage:
#   ./ops_database.sh                              # fully interactive
#   ./ops_database.sh <op>                         # prompts for env
#   ./ops_database.sh <env> <op> [args...]         # fully non-interactive
#
# env tokens : 1 | 2 | prod | production | staging | stage | dev
#
# Subcommands:
#   drop     [--yes]                               # staging only
#   rebuild  [--yes]                               # staging only (DROP+SCHEMA+PROC+DATA)
#   prune    [tier1|tier2|tier3|tier4|type:<id>:<days>]
#   backup   [dest-dir] [zip|nozip]
#   optimize <table> [tmpdir]
#   metrics  <subop> [args...]
#     size    [table] [--top N]                    # per-table footprint (default top 20)
#     inspect <table>                              # combined size/bloat/payload/disk
#
# Examples:
#   ./ops_database.sh prod backup /3ddigip01/Packrat/Backups/Database zip
#   ./ops_database.sh staging prune tier2
#   ./ops_database.sh prod metrics size --top 10
#   ./ops_database.sh prod metrics inspect Audit
#   ./ops_database.sh staging rebuild --yes
#
# Safety:
#   - drop/rebuild refuse to run on prod from this script.
#   - backup, prune, optimize wrap their work in with_lock; cron overlaps
#     cleanly skip (exit 75) instead of colliding.
#   - mysqldump output is registered with register_tmp_file so Ctrl+C
#     during a backup removes the partial .sql.
#   - metrics is read-only against information_schema + data tables.
#

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_SCRIPT_NAME="ops_database.sh"

# shellcheck source=lib/common.sh
source "$HERE/lib/common.sh"
# shellcheck source=lib/credentials.sh
source "$HERE/lib/credentials.sh"

init_traps

# ---------------------------------------------------------------------------
# Constants (top-of-file so operators can tune without reading the logic)
# ---------------------------------------------------------------------------

DEFAULT_BACKUP_DIR="${DEFAULT_BACKUP_DIR:-/3ddigip01/Packrat/Backups/Database}"

# DELETE chunk size for op_prune. Big enough to make progress on a multi-
# million-row Audit, small enough to avoid InnoDB lock-table blowups.
PRUNE_CHUNK_SIZE="${PRUNE_CHUNK_SIZE:-10000}"

# `metrics size` default limit when a table isn't specified.
METRICS_SIZE_DEFAULT_TOP="${METRICS_SIZE_DEFAULT_TOP:-20}"

# ---------------------------------------------------------------------------
# AuditType enum reference (see server/db/api/ObjectType.ts eAuditType)
# ---------------------------------------------------------------------------
#   1  eDBCreate      2  eDBUpdate      3  eDBDelete
#   4  eAuthLogin     5  eSceneQCd      6  eHTTPDownload
#   7  eHTTPUpload    8  eAuthFailed    9  eAuthDenied
#   10 eSolrRebuild   11 eAuthGranted  12 eAuthRevoked
#
# Tiers go from light (safe) to aggressive. Each tier deletes rows older
# than a given age window, filtered by AuditType.

TIER1_HTTP_SOLR_DAYS="${TIER1_HTTP_SOLR_DAYS:-90}"
TIER2_AUTH_NOISE_DAYS="${TIER2_AUTH_NOISE_DAYS:-180}"
TIER3_CREATE_UPDATE_DAYS="${TIER3_CREATE_UPDATE_DAYS:-365}"
TIER4_EVERYTHING_DAYS="${TIER4_EVERYTHING_DAYS:-730}"

# ---------------------------------------------------------------------------
# Tier WHERE clause builder
# ---------------------------------------------------------------------------

build_tier_where() {
    case "$1" in
        tier1)
            printf 'AuditType IN (6,7,10) AND AuditDate < DATE_SUB(NOW(), INTERVAL %s DAY)' \
                "$TIER1_HTTP_SOLR_DAYS"
            ;;
        tier2)
            printf '((AuditType IN (6,7,10) AND AuditDate < DATE_SUB(NOW(), INTERVAL %s DAY)) OR (AuditType IN (8,9,11,12) AND AuditDate < DATE_SUB(NOW(), INTERVAL %s DAY)))' \
                "$TIER1_HTTP_SOLR_DAYS" "$TIER2_AUTH_NOISE_DAYS"
            ;;
        tier3)
            printf '((AuditType IN (6,7,10) AND AuditDate < DATE_SUB(NOW(), INTERVAL %s DAY)) OR (AuditType IN (8,9,11,12) AND AuditDate < DATE_SUB(NOW(), INTERVAL %s DAY)) OR (AuditType IN (1,2,4,5) AND AuditDate < DATE_SUB(NOW(), INTERVAL %s DAY)))' \
                "$TIER1_HTTP_SOLR_DAYS" "$TIER2_AUTH_NOISE_DAYS" "$TIER3_CREATE_UPDATE_DAYS"
            ;;
        tier4)
            printf 'AuditDate < DATE_SUB(NOW(), INTERVAL %s DAY)' \
                "$TIER4_EVERYTHING_DAYS"
            ;;
        *)
            return 1
            ;;
    esac
}

print_tier_descriptions() {
    echo ""
    echo "Audit prune tiers:"
    printf "  [1] tier1 - HTTP traffic + Solr rebuild events         > %3s days\n" "$TIER1_HTTP_SOLR_DAYS"
    printf "  [2] tier2 - tier1 + auth noise (fail/deny/grant/revoke) > %3s days\n" "$TIER2_AUTH_NOISE_DAYS"
    printf "  [3] tier3 - tier2 + create/update/login/sceneQCd        > %3s days\n" "$TIER3_CREATE_UPDATE_DAYS"
    printf "  [4] tier4 - everything including deletes                > %3s days\n" "$TIER4_EVERYTHING_DAYS"
    echo "  [5] type  - prune by specific AuditType id + age (days)"
    echo ""
    echo "AuditType reference:"
    echo "   1=DBCreate  2=DBUpdate  3=DBDelete  4=AuthLogin  5=SceneQCd"
    echo "   6=HTTPDownload  7=HTTPUpload  8=AuthFailed  9=AuthDenied"
    echo "  10=SolrRebuild  11=AuthGranted  12=AuthRevoked"
}

# ---------------------------------------------------------------------------
# Small DB helpers
# ---------------------------------------------------------------------------

is_valid_identifier() {
    [[ "$1" =~ ^[A-Za-z0-9_]+$ ]]
}

audit_count() {
    mysql_exec "SELECT COUNT(*) FROM Audit;" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Operation: drop (staging only)
# ---------------------------------------------------------------------------

op_drop() {
    OPS_CURRENT_OP="drop"
    local assume_yes=false
    while (( $# > 0 )); do
        case "$1" in
            --yes|-y) assume_yes=true ;;
            *)        err "drop: unknown arg '$1'"; return 1 ;;
        esac
        shift
    done

    if [[ "$ENVIRONMENT" != "staging" ]]; then
        err "drop is only allowed on staging"
        err "production drops must be performed manually"
        return 1
    fi

    banner "DROP DATABASE ($ENV_LABEL / $DB_NAME)"
    echo "This will DROP all tables in $DB_NAME on $DB_HOST."
    echo "Schema file: $SQL_PATH/Packrat.DROP.sql"

    if ! $assume_yes; then
        if ! confirm_danger "Drop $DB_NAME on $DB_HOST?"; then
            echo "Cancelled."
            return 1
        fi
    fi

    if [[ ! -f "$SQL_PATH/Packrat.DROP.sql" ]]; then
        err "DROP script not found: $SQL_PATH/Packrat.DROP.sql"
        return 1
    fi

    echo "Dropping..."
    mysql_exec_file "$SQL_PATH/Packrat.DROP.sql"
}

# ---------------------------------------------------------------------------
# Operation: rebuild (staging only)
# ---------------------------------------------------------------------------

op_rebuild() {
    OPS_CURRENT_OP="rebuild"
    local assume_yes=false
    while (( $# > 0 )); do
        case "$1" in
            --yes|-y) assume_yes=true ;;
            *)        err "rebuild: unknown arg '$1'"; return 1 ;;
        esac
        shift
    done

    if [[ "$ENVIRONMENT" != "staging" ]]; then
        err "rebuild is only allowed on staging"
        return 1
    fi

    banner "REBUILD DATABASE ($ENV_LABEL / $DB_NAME)"
    echo "Will run DROP, SCHEMA, PROC, DATA scripts from:"
    echo "  $SQL_PATH"

    if ! $assume_yes; then
        if ! confirm_danger "Rebuild $DB_NAME on $DB_HOST?"; then
            echo "Cancelled."
            return 1
        fi
    fi

    local step
    for step in Packrat.DROP.sql Packrat.SCHEMA.sql Packrat.PROC.sql Packrat.DATA.sql; do
        if [[ ! -f "$SQL_PATH/$step" ]]; then
            err "missing SQL file: $SQL_PATH/$step"
            return 1
        fi
    done

    echo "[1/4] Dropping..."
    mysql_exec_file "$SQL_PATH/Packrat.DROP.sql"   || return 1
    echo "[2/4] Applying schema..."
    mysql_exec_file "$SQL_PATH/Packrat.SCHEMA.sql" || return 1
    echo "[3/4] Applying procedures..."
    mysql_exec_file "$SQL_PATH/Packrat.PROC.sql"   || return 1
    echo "[4/4] Applying seed data..."
    mysql_exec_file "$SQL_PATH/Packrat.DATA.sql"   || return 1
    echo "Rebuild complete."
}

# ---------------------------------------------------------------------------
# Operation: prune audit records
# ---------------------------------------------------------------------------

op_prune() {
    OPS_CURRENT_OP="prune"
    local selector="${1:-}"

    banner "PRUNE AUDIT RECORDS ($ENV_LABEL / $DB_NAME)"

    if [[ -z "$selector" ]]; then
        print_tier_descriptions
        local choice
        read -r -p "Choose [1-5]: " choice
        case "$choice" in
            1) selector="tier1" ;;
            2) selector="tier2" ;;
            3) selector="tier3" ;;
            4) selector="tier4" ;;
            5)
                local tid age
                read -r -p "AuditType id: " tid
                read -r -p "Age in days (rows older than): " age
                selector="type:${tid}:${age}"
                ;;
            *) err "invalid choice"; return 1 ;;
        esac
    fi

    local where=""
    if [[ "$selector" == tier* ]]; then
        if ! where=$(build_tier_where "$selector"); then
            err "unknown tier: $selector"
            return 1
        fi
    elif [[ "$selector" == type:* ]]; then
        # type:<id> or type:<id>:<days>
        local rest="${selector#type:}"
        local tid="${rest%%:*}"
        local age="${rest#*:}"
        if [[ "$age" == "$rest" || -z "$age" ]]; then
            # no age suffix given - prompt only if interactive
            if [[ -t 0 ]]; then
                read -r -p "Age in days (rows older than): " age
            else
                err "selector '$selector' missing age (use type:<id>:<days>)"
                return 1
            fi
        fi
        if ! [[ "$tid" =~ ^[0-9]+$ && "$age" =~ ^[0-9]+$ ]]; then
            err "invalid type or age"
            return 1
        fi
        where="AuditType = $tid AND AuditDate < DATE_SUB(NOW(), INTERVAL $age DAY)"
    else
        err "unknown selector: $selector"
        return 1
    fi

    # Cron-safe serialization - one prune writer per env at a time.
    with_lock "database-prune-${ENVIRONMENT}" -- \
        __prune_run "$selector" "$where"
}

__prune_run() {
    local selector="$1"
    local where="$2"

    echo ""
    echo "Collecting before-metrics..."
    local total_before
    total_before=$(audit_count)
    local matched
    matched=$(mysql_exec "SELECT COUNT(*) FROM Audit WHERE $where;")
    echo "  Total Audit rows : $total_before"
    echo "  Rows to delete   : $matched"
    echo "  Selector         : $selector"

    if [[ "$matched" == "0" || -z "$matched" ]]; then
        echo "Nothing to prune."
        return 0
    fi

    # Prompt only when interactive. Cron callers pass the selector directly
    # and should expect the delete to run.
    if [[ -t 0 ]]; then
        if ! confirm "Proceed with delete?"; then
            echo "Cancelled."
            return 1
        fi
    fi

    local chunk="$PRUNE_CHUNK_SIZE"
    local deleted=0
    echo "Deleting in chunks of $chunk..."
    while true; do
        if (( INTERRUPTED == 1 )); then break; fi
        local rows
        rows=$(mysql_exec "DELETE FROM Audit WHERE $where LIMIT $chunk; SELECT ROW_COUNT();" | tail -n 1)
        if [[ -z "$rows" || "$rows" == "0" ]]; then
            break
        fi
        deleted=$(( deleted + rows ))
        printf "  deleted: %d / %s\r" "$deleted" "$matched"
    done
    echo ""

    echo "Collecting after-metrics..."
    local total_after
    total_after=$(audit_count)
    echo ""
    echo "  Before total : $total_before"
    echo "  After  total : $total_after"
    echo "  Deleted      : $deleted"
}

# ---------------------------------------------------------------------------
# Operation: backup
# ---------------------------------------------------------------------------

op_backup() {
    OPS_CURRENT_OP="backup"
    local dest_dir="${1:-}"
    local zip_flag="${2:-}"

    banner "BACKUP DATABASE ($ENV_LABEL / $DB_NAME)"

    if [[ -z "$dest_dir" ]]; then
        read -r -p "Backup directory [$DEFAULT_BACKUP_DIR]: " dest_dir
        dest_dir="${dest_dir:-$DEFAULT_BACKUP_DIR}"
    fi
    if [[ ! -d "$dest_dir" ]]; then
        mkdir -p -- "$dest_dir" || { err "cannot create $dest_dir"; return 1; }
    fi

    if [[ -z "$zip_flag" ]]; then
        if [[ -t 0 ]]; then
            if confirm "Compress the backup with zip?"; then
                zip_flag="zip"
            else
                zip_flag="nozip"
            fi
        else
            zip_flag="zip"
        fi
    fi
    case "$zip_flag" in
        zip|nozip) ;;
        *) err "invalid compression flag: '$zip_flag' (use zip | nozip)"; return 1 ;;
    esac

    require_cmd mysqldump || return 127
    if [[ "$zip_flag" == "zip" ]]; then
        require_cmd zip || return 127
    fi

    # Prepare the output paths in the outer shell (not inside the with_lock
    # subshell) so TMP_FILES survives for the EXIT/INT trap. A SIGINT while
    # mysqldump is writing would otherwise leave a partial .sql behind.
    local ts sql_file zip_file=""
    ts=$(date +"%F_%H-%M-%S")
    sql_file="$dest_dir/${DB_NAME}.${ts}.sql"
    register_tmp_file "$sql_file"
    if [[ "$zip_flag" == "zip" ]]; then
        zip_file="${sql_file}.zip"
        register_tmp_file "$zip_file"
    fi

    # Cron-safe serialization. The lock name includes env + destination so
    # two differently-targeted backups can still run in parallel; same-dir
    # overlaps cleanly skip.
    local dest_key rc=0
    dest_key="$(echo -n "$dest_dir" | tr -c 'A-Za-z0-9' '-')"
    with_lock "database-backup-${ENVIRONMENT}-${dest_key}" -- \
        __backup_run "$sql_file" "$zip_file" "$zip_flag" || rc=$?

    # Only de-register the output paths once the work succeeded; otherwise
    # the trap should still clean up the partial artifacts.
    if (( rc == 0 )); then
        __tmp_files_forget "$sql_file"
        [[ -n "$zip_file" ]] && __tmp_files_forget "$zip_file"
    fi
    return $rc
}

__backup_run() {
    local sql_file="$1"
    local zip_file="$2"
    local zip_flag="$3"

    echo "Writing dump to: $sql_file"
    local rc=0
    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --routines \
        --skip-lock-tables \
        --single-transaction \
        --result-file="$sql_file" \
        "$DB_NAME" || rc=$?
    if (( rc != 0 )); then
        err "mysqldump failed (rc=$rc)"
        return $rc
    fi

    if [[ "$zip_flag" == "zip" ]]; then
        echo "Compressing..."
        if zip -j "$zip_file" "$sql_file" >/dev/null; then
            rm -f -- "$sql_file"
            echo "Backup: $zip_file"
            ls -lh -- "$zip_file"
        else
            err "zip failed"
            return 1
        fi
    else
        echo "Backup: $sql_file"
        ls -lh -- "$sql_file"
    fi
}

# Remove a path from TMP_FILES once we've decided it's safe (successful
# write). Mirrors register_tmp_file's append-only pattern.
__tmp_files_forget() {
    local target="$1"
    local -a kept=()
    local f
    for f in "${TMP_FILES[@]:-}"; do
        [[ "$f" != "$target" ]] && kept+=("$f")
    done
    TMP_FILES=("${kept[@]}")
}

# ---------------------------------------------------------------------------
# Operation: optimize
# ---------------------------------------------------------------------------

op_optimize() {
    OPS_CURRENT_OP="optimize"
    local table="${1:-}"
    local tmpdir="${2:-}"

    banner "OPTIMIZE TABLE ($ENV_LABEL / $DB_NAME)"

    if [[ -z "$table" ]]; then
        read -r -p "Table name: " table
    fi
    if [[ -z "$table" ]]; then
        err "no table specified"
        return 1
    fi
    if ! is_valid_identifier "$table"; then
        err "invalid table name: '$table'"
        return 1
    fi

    if [[ -z "$tmpdir" && -t 0 ]]; then
        read -r -p "Alternate innodb_tmpdir (blank for server default): " tmpdir
    fi

    local pre_sql=""
    if [[ -n "$tmpdir" ]]; then
        if [[ ! -d "$tmpdir" ]]; then
            err "tmp dir does not exist: $tmpdir"
            return 1
        fi
        pre_sql="SET SESSION innodb_tmpdir = '$tmpdir'; "
        echo "Using innodb_tmpdir = $tmpdir"
    fi

    with_lock "database-optimize-${ENVIRONMENT}-${table}" -- \
        __optimize_run "$table" "$pre_sql"
}

__optimize_run() {
    local table="$1"
    local pre_sql="$2"

    echo "Size before:"
    mysql_exec "SELECT DATA_LENGTH, INDEX_LENGTH, DATA_FREE FROM information_schema.TABLES \
                WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table';"

    echo "Running OPTIMIZE TABLE \`$table\` ..."
    mysql_exec "${pre_sql}OPTIMIZE TABLE \`$table\`;"

    echo "Size after:"
    mysql_exec "SELECT DATA_LENGTH, INDEX_LENGTH, DATA_FREE FROM information_schema.TABLES \
                WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table';"
}

# ---------------------------------------------------------------------------
# Operation: metrics (Phase 5 ships `size` + `inspect` only)
# ---------------------------------------------------------------------------
#
# Deferred subops (bloat, payload, age, types, disk, --format csv|json) are
# documented in PLAN_SERVER_OPS_REFACTOR.md under "metrics sub-suite". They
# are not wired up yet.

op_metrics() {
    OPS_CURRENT_OP="metrics"
    local sub="${1:-}"
    [[ -n "$sub" ]] && shift

    if [[ -z "$sub" ]]; then
        print_metrics_submenu
        local c
        read -r -p "Choose: " c
        case "$c" in
            1) sub="size" ;;
            7) sub="inspect" ;;
            2|3|4|5|6) err "subop deferred (see PLAN_SERVER_OPS_REFACTOR.md)"; return 1 ;;
            [Bb]) return 0 ;;
            *) err "invalid choice"; return 1 ;;
        esac
    fi

    case "$sub" in
        size)    op_metrics_size    "$@" ;;
        inspect) op_metrics_inspect "$@" ;;
        bloat|payload|age|types|disk)
            err "metrics '$sub' is deferred (see PLAN_SERVER_OPS_REFACTOR.md)"
            return 1
            ;;
        *) err "unknown metrics subop: $sub"; return 1 ;;
    esac
}

print_metrics_submenu() {
    echo ""
    echo "[1] Size       - per-table footprint"
    echo "[2] Bloat      - (deferred)"
    echo "[3] Payload    - (deferred)"
    echo "[4] Age        - (deferred)"
    echo "[5] Types      - (deferred)"
    echo "[6] Disk       - (deferred)"
    echo "[7] Inspect    - combined report for a single table"
    echo "[B] Back"
    echo ""
}

# metrics size [table] [--top N]
op_metrics_size() {
    local table=""
    local top="$METRICS_SIZE_DEFAULT_TOP"
    while (( $# > 0 )); do
        case "$1" in
            --top)   top="${2:-}"; shift 2; continue ;;
            --top=*) top="${1#--top=}" ;;
            *)       [[ -z "$table" ]] && table="$1" ;;
        esac
        shift
    done

    if [[ -n "$table" ]] && ! is_valid_identifier "$table"; then
        err "invalid table name: '$table'"
        return 1
    fi
    if ! [[ "$top" =~ ^[0-9]+$ ]] || (( top < 1 )); then
        err "--top must be a positive integer (got: '$top')"
        return 1
    fi

    banner "METRICS SIZE ($ENV_LABEL / $DB_NAME)"
    if [[ -n "$table" ]]; then
        echo "Table: $table"
    else
        echo "Top $top tables by total size"
    fi
    echo ""

    local sql
    sql="$(metrics_size_sql "$table")"
    if [[ -z "$table" ]]; then
        # Append LIMIT to the whole-schema query. metrics_size_sql emits a
        # trailing semicolon; replace it with ' LIMIT N;'.
        sql="${sql%;*} LIMIT $top;"
    fi
    mysql_exec "$sql"
}

# metrics inspect <table>
#
# Combined "first thing you run" report for a single table:
#   1. size row (from metrics_size_sql)
#   2. DATA_FREE / bloat hint
#   3. Per fat-column payload analysis (Text, LongText, MediumText, BLOB*)
#   4. .ibd file on disk (best-effort; requires datadir access)
#
# Emits a progress line per fat column so operators can watch long scans.
op_metrics_inspect() {
    local table="${1:-}"
    if [[ -z "$table" ]]; then
        err "metrics inspect requires <table>"
        echo "usage: ops_database.sh [env] metrics inspect <table>" >&2
        return 1
    fi
    if ! is_valid_identifier "$table"; then
        err "invalid table name: '$table'"
        return 1
    fi

    banner "METRICS INSPECT ($ENV_LABEL / $DB_NAME / $table)"

    echo "--- 1. Size ---"
    mysql_exec "$(metrics_size_sql "$table")"

    echo ""
    echo "--- 2. Bloat (DATA_FREE vs total) ---"
    note "DATA_FREE undercounts reclaimable space on InnoDB; treat as a hint"
    mysql_exec "\
        SELECT TABLE_NAME                                         AS table_name,
               ROUND(DATA_FREE / 1024 / 1024 / 1024, 3)           AS free_gb,
               ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 / 1024, 3) AS total_gb,
               ROUND(DATA_FREE / NULLIF(DATA_LENGTH + INDEX_LENGTH, 0) * 100, 2) AS pct_free
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table';"

    echo ""
    echo "--- 3. Payload (Text/LongText/BLOB columns) ---"
    # Auto-detect fat columns
    local cols
    cols=$(mysql_exec "\
        SELECT COLUMN_NAME FROM information_schema.COLUMNS \
        WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table' \
          AND DATA_TYPE IN ('text','mediumtext','longtext','blob','mediumblob','longblob') \
        ORDER BY ORDINAL_POSITION;")

    if [[ -z "$cols" ]]; then
        echo "(no Text/BLOB columns on $table)"
    else
        local col
        while IFS= read -r col; do
            [[ -z "$col" ]] && continue
            echo ""
            echo "[column: $col]"
            mysql_exec "\
                SELECT COUNT(*)                                            AS total_rows,
                       SUM(CASE WHEN \`$col\` IS NULL THEN 0 ELSE 1 END)   AS rows_with_value,
                       ROUND(AVG(OCTET_LENGTH(\`$col\`)) / 1024, 3)        AS avg_kb,
                       ROUND(MAX(OCTET_LENGTH(\`$col\`)) / 1024, 3)        AS max_kb,
                       ROUND(SUM(OCTET_LENGTH(\`$col\`)) / 1024 / 1024 / 1024, 3) AS total_gb
                FROM \`$table\`;"
        done <<< "$cols"
    fi

    echo ""
    echo "--- 4. Disk (.ibd file) ---"
    # Best-effort: datadir is server-side and may not be readable by the
    # mysql client user. We print the path MariaDB reports and let the
    # operator stat it if they want to.
    local datadir
    datadir=$(mysql_exec "SELECT @@datadir;" | head -n 1)
    if [[ -z "$datadir" ]]; then
        warn "could not resolve @@datadir"
    else
        local ibd="$datadir$DB_NAME/$table.ibd"
        echo "Expected path: $ibd"
        if [[ -r "$ibd" ]]; then
            ls -lh -- "$ibd"
        else
            note "file not readable from this host - run 'ls -lh $ibd' on the DB server"
        fi
    fi
}

# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

main_menu() {
    clear
    banner "PACKRAT DATABASE OPS"
    echo "Environment: $ENV_LABEL ($DB_NAME @ $DB_HOST)"
    echo "Env file   : $ENV_FILE_USED"
    echo "DB user    : $DB_USER"
    echo ""
    # drop/rebuild are staging-only - hide them on prod to avoid confusion.
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        echo "[1] Drop database"
        echo "[2] Rebuild database"
    fi
    echo "[3] Prune audit records"
    echo "[4] Backup database"
    echo "[5] Optimize table"
    echo "[6] Metrics"
    echo "[Q] Quit"
    echo ""
    local c
    read -r -p "Choose: " c
    case "$c" in
        1)
            if [[ "$ENVIRONMENT" != "staging" ]]; then
                err "drop is staging-only"; return 1
            fi
            op_drop
            ;;
        2)
            if [[ "$ENVIRONMENT" != "staging" ]]; then
                err "rebuild is staging-only"; return 1
            fi
            op_rebuild
            ;;
        3) op_prune ;;
        4) op_backup ;;
        5) op_optimize ;;
        6) op_metrics ;;
        [Qq]) exit 0 ;;
        *) err "invalid choice"; return 1 ;;
    esac
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

print_help() {
    sed -n '2,47p' "$0"
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

# If no env provided via CLI, prompt.
if [[ -z "${ENVIRONMENT:-}" ]]; then
    select_env_interactive
fi

# Load creds / paths for the chosen environment.
if ! load_credentials; then
    print_summary "FAIL"
    exit 1
fi

status="OK"
rc=0

if [[ -z "$OP" ]]; then
    main_menu || rc=$?
else
    # Enforce staging-only ops at the dispatch layer too, so CLI callers
    # can't bypass the interactive menu gating.
    if [[ "$ENVIRONMENT" == "prod" && ( "$OP" == "drop" || "$OP" == "rebuild" ) ]]; then
        err "'$OP' is not permitted on production from this script"
        err "run it manually if truly required"
        rc=1
    else
        case "$OP" in
            drop)     op_drop     "$@" || rc=$? ;;
            rebuild)  op_rebuild  "$@" || rc=$? ;;
            prune)    op_prune    "$@" || rc=$? ;;
            backup)   op_backup   "$@" || rc=$? ;;
            optimize) op_optimize "$@" || rc=$? ;;
            metrics)  op_metrics  "$@" || rc=$? ;;
            *)        err "unknown op: $OP"; rc=1 ;;
        esac
    fi
fi

(( rc != 0 )) && status="FAIL"
print_summary "$status"
exit $rc
