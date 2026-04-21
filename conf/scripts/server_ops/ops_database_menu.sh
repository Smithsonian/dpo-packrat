#!/bin/bash
#
# ops_database_menu.sh - Packrat database operations menu
#
# Interactive menu + CLI-driven database ops for Packrat (production/staging).
# Credentials are sourced from the project's .env.prod / .env.dev files;
# nothing is hardcoded in this script.
#
# Usage (interactive):
#   ./ops_database_menu.sh
#
# Usage (CLI):
#   ./ops_database_menu.sh <env> <op> [op-args...]
#     env : prod | staging
#     op  : drop | rebuild | prune | backup | optimize | metrics
#
# Operation availability:
#   - prod    : prune, backup, optimize, metrics   (drop/rebuild are BLOCKED)
#   - staging : all six operations
#
# Drop and rebuild on production must be performed manually by an operator.
#
# Credential discovery:
#   Credentials are parsed from PACKRAT_DATABASE_URL in the environment's
#   .env file (via grep, not source). That URL uses the application DB
#   user "packrat" - not root@localhost. The packrat user has enough
#   privilege for all ops this script performs on its own schema.
#     prod    : /data/Packrat/Code/dpo-packrat/.env.prod
#     staging : /data/Packrat/Code-Dev/dpo-packrat/.env.dev
#
# Examples:
#   ./ops_database_menu.sh prod backup /3ddigip01/Packrat/Backups/Database zip
#   ./ops_database_menu.sh staging prune tier2
#   ./ops_database_menu.sh prod prune type:6
#   ./ops_database_menu.sh prod optimize Audit
#   ./ops_database_menu.sh prod metrics Audit
#

# ---------------------------------------------------------------------------
# Configuration - adjust these paths if the deployment layout changes
# ---------------------------------------------------------------------------

PROD_CODE_ROOT="/data/Packrat/Code/dpo-packrat"
STAGING_CODE_ROOT="/data/Packrat/Code-Dev/dpo-packrat"

PROD_ENV_FILE="$PROD_CODE_ROOT/.env.prod"
STAGING_ENV_FILE="$STAGING_CODE_ROOT/.env.dev"

PROD_SQL_PATH="$PROD_CODE_ROOT/server/db/sql/scripts"
STAGING_SQL_PATH="$STAGING_CODE_ROOT/server/db/sql/scripts"

DEFAULT_BACKUP_DIR="/3ddigip01/Packrat/Backups/Database"

# populated by load_credentials()
DB_HOST=""
DB_PORT=""
DB_USER=""
DB_PASS=""
DB_NAME=""
SQL_PATH=""
ENV_LABEL=""

# populated by select_env()
ENVIRONMENT=""

# Start-of-run timestamp for summary output
SCRIPT_START_EPOCH=$(date +%s)

# ---------------------------------------------------------------------------
# Signal handling - make sure we clean up on Ctrl+C / kill
# ---------------------------------------------------------------------------

INTERRUPTED=0
CURRENT_TMP_FILE=""

cleanup() {
    # Remove any dangling temp file from an in-progress op
    if [[ -n "$CURRENT_TMP_FILE" && -f "$CURRENT_TMP_FILE" ]]; then
        echo ""
        echo "Cleaning up partial file: $CURRENT_TMP_FILE"
        rm -f "$CURRENT_TMP_FILE"
    fi
}

on_interrupt() {
    INTERRUPTED=1
    echo ""
    echo "*** Interrupted. Cleaning up... ***"
    cleanup
    print_summary "INTERRUPTED"
    exit 130
}

trap on_interrupt INT TERM
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Print a boxed banner
banner() {
    echo ""
    echo "====================================================="
    echo "$1"
    echo "====================================================="
}

# Print the final summary line. Called on success, failure, and interrupt.
print_summary() {
    local status="$1"
    local now=$(date +%s)
    local elapsed=$(( now - SCRIPT_START_EPOCH ))
    local mins=$(( elapsed / 60 ))
    local secs=$(( elapsed % 60 ))
    echo ""
    echo "-----------------------------------------------------"
    echo "STATUS   : $status"
    echo "ENV      : ${ENV_LABEL:-n/a}"
    echo "DATABASE : ${DB_NAME:-n/a}"
    echo "ELAPSED  : ${mins}m ${secs}s"
    echo "-----------------------------------------------------"
}

# Parse mysql:// URL into DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME
# Example input: mysql://packrat:pass@host:3306/PackratProduction
parse_database_url() {
    local url="$1"
    # strip scheme
    local rest="${url#mysql://}"
    # credentials portion (before '@')
    local creds="${rest%%@*}"
    # host/db portion (after '@')
    local hostdb="${rest#*@}"

    DB_USER="${creds%%:*}"
    DB_PASS="${creds#*:}"

    # split host:port from /database
    local hostport="${hostdb%%/*}"
    DB_NAME="${hostdb#*/}"

    if [[ "$hostport" == *:* ]]; then
        DB_HOST="${hostport%%:*}"
        DB_PORT="${hostport#*:}"
    else
        DB_HOST="$hostport"
        DB_PORT="3306"
    fi
}

# Source the appropriate .env file and populate DB_* vars.
# Expects ENVIRONMENT to already be "prod" or "staging".
load_credentials() {
    local env_file=""
    case "$ENVIRONMENT" in
        prod)
            env_file="$PROD_ENV_FILE"
            SQL_PATH="$PROD_SQL_PATH"
            ENV_LABEL="PRODUCTION"
            ;;
        staging)
            env_file="$STAGING_ENV_FILE"
            SQL_PATH="$STAGING_SQL_PATH"
            ENV_LABEL="STAGING"
            ;;
        *)
            echo "ERROR: unknown environment '$ENVIRONMENT'"
            return 1
            ;;
    esac

    if [[ ! -f "$env_file" ]]; then
        echo "ERROR: env file not found: $env_file"
        return 1
    fi

    # Pull PACKRAT_DATABASE_URL from the env file without sourcing
    # (sourcing could execute arbitrary shell). Just grep the value.
    local url
    url=$(grep -E '^PACKRAT_DATABASE_URL=' "$env_file" | head -n 1 | cut -d= -f2-)
    if [[ -z "$url" ]]; then
        echo "ERROR: PACKRAT_DATABASE_URL not found in $env_file"
        return 1
    fi

    parse_database_url "$url"

    # Staging env file points at the dev database ("Packrat") - but the
    # staging database on the shared host is named "PackratStaging". If the
    # user set STAGING_DB_NAME explicitly, respect it; otherwise override.
    if [[ "$ENVIRONMENT" == "staging" && "$DB_NAME" == "Packrat" ]]; then
        DB_NAME="PackratStaging"
    fi
}

# Run a mysql command against the selected database.
# All output goes to stdout/stderr; caller handles capture.
mysql_exec() {
    mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --database="$DB_NAME" \
        --default-character-set=utf8mb4 \
        --batch --skip-column-names \
        -e "$1"
}

# Same as mysql_exec but reads the SQL from a file.
mysql_exec_file() {
    mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --database="$DB_NAME" \
        --default-character-set=utf8mb4 \
        < "$1"
}

# Prompt for y/N confirmation; returns 0 on yes, 1 otherwise.
confirm() {
    local prompt="$1"
    read -r -p "$prompt [y/N]: " reply
    [[ "$reply" =~ ^[Yy]$ ]]
}

# Dump a human-readable row count for the Audit table
audit_count() {
    mysql_exec "SELECT COUNT(*) FROM Audit;" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Audit prune tier definitions
# ---------------------------------------------------------------------------
#
# AuditType enum (see server/db/api/ObjectType.ts eAuditType):
#   1  eDBCreate      2  eDBUpdate      3  eDBDelete
#   4  eAuthLogin     5  eSceneQCd      6  eHTTPDownload
#   7  eHTTPUpload    8  eAuthFailed    9  eAuthDenied
#   10 eSolrRebuild   11 eAuthGranted  12 eAuthRevoked
#
# Tiers go from light (safe) to aggressive (lossy). Each tier deletes
# rows older than a given age window, filtered by AuditType.
#
# Tier 1 - light   : HTTP traffic + Solr rebuild noise > 90 days
# Tier 2 - standard: Tier 1 + auth noise (failed/denied/granted/revoked) > 180 days
# Tier 3 - heavy   : Tier 2 + DB create/update/login/sceneQCd > 365 days (keep deletes)
# Tier 4 - deep    : everything (including deletes) > 730 days

print_tier_descriptions() {
    echo ""
    echo "Audit prune tiers:"
    echo "  [1] tier1 - HTTP traffic + Solr rebuild events older than  90 days"
    echo "  [2] tier2 - tier1 + auth noise (failed/denied/grant/revoke) >180 days"
    echo "  [3] tier3 - tier2 + create/update/login/sceneQCd            >365 days"
    echo "  [4] tier4 - everything including deletes                    >730 days"
    echo "  [5] type  - prune by specific AuditType id + age (days)"
    echo ""
    echo "AuditType reference:"
    echo "   1=DBCreate  2=DBUpdate  3=DBDelete  4=AuthLogin  5=SceneQCd"
    echo "   6=HTTPDownload  7=HTTPUpload  8=AuthFailed  9=AuthDenied"
    echo "  10=SolrRebuild  11=AuthGranted  12=AuthRevoked"
}

# Build the WHERE clause for a given tier.
# $1 = tier name (tier1 .. tier4)
build_tier_where() {
    case "$1" in
        tier1)
            echo "AuditType IN (6,7,10) AND AuditDate < DATE_SUB(NOW(), INTERVAL 90 DAY)"
            ;;
        tier2)
            echo "((AuditType IN (6,7,10) AND AuditDate < DATE_SUB(NOW(), INTERVAL 90 DAY))" \
                 "OR (AuditType IN (8,9,11,12) AND AuditDate < DATE_SUB(NOW(), INTERVAL 180 DAY)))"
            ;;
        tier3)
            echo "((AuditType IN (6,7,10) AND AuditDate < DATE_SUB(NOW(), INTERVAL 90 DAY))" \
                 "OR (AuditType IN (8,9,11,12) AND AuditDate < DATE_SUB(NOW(), INTERVAL 180 DAY))" \
                 "OR (AuditType IN (1,2,4,5) AND AuditDate < DATE_SUB(NOW(), INTERVAL 365 DAY)))"
            ;;
        tier4)
            echo "AuditDate < DATE_SUB(NOW(), INTERVAL 730 DAY)"
            ;;
        *)
            return 1
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Operation: drop database
# ---------------------------------------------------------------------------

op_drop() {
    # Hard policy: drop is never run against production from this script.
    # Production drops must be executed manually by an operator.
    if [[ "$ENVIRONMENT" != "staging" ]]; then
        echo "ERROR: drop is only allowed on staging."
        echo "Production drops must be performed manually."
        return 1
    fi

    banner "DROP DATABASE (STAGING / $DB_NAME)"
    echo ""
    echo "This will DROP all tables in $DB_NAME on $DB_HOST."
    if ! confirm "Are you absolutely sure?"; then
        echo "Cancelled."
        return 1
    fi

    echo "Dropping..."
    mysql_exec_file "$SQL_PATH/Packrat.DROP.sql"
}

# ---------------------------------------------------------------------------
# Operation: rebuild database (staging only)
# ---------------------------------------------------------------------------

op_rebuild() {
    if [[ "$ENVIRONMENT" != "staging" ]]; then
        echo "ERROR: rebuild is only allowed on staging."
        return 1
    fi

    banner "REBUILD DATABASE (STAGING / $DB_NAME)"
    echo "Will run DROP, SCHEMA, PROC, DATA scripts from:"
    echo "  $SQL_PATH"
    if ! confirm "Continue?"; then
        echo "Cancelled."
        return 1
    fi

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

# $1 optional pre-selected tier/type (e.g. "tier2" or "type:6")
op_prune() {
    banner "PRUNE AUDIT RECORDS ($ENV_LABEL / $DB_NAME)"

    local selector="$1"
    if [[ -z "$selector" ]]; then
        print_tier_descriptions
        read -r -p "Choose [1-5]: " choice
        case "$choice" in
            1) selector="tier1" ;;
            2) selector="tier2" ;;
            3) selector="tier3" ;;
            4) selector="tier4" ;;
            5)
                read -r -p "AuditType id: " tid
                read -r -p "Age in days (rows older than): " age
                selector="type:${tid}:${age}"
                ;;
            *) echo "Invalid."; return 1 ;;
        esac
    fi

    # Build the WHERE clause
    local where=""
    if [[ "$selector" == tier* ]]; then
        where=$(build_tier_where "$selector") || { echo "Unknown tier: $selector"; return 1; }
    elif [[ "$selector" == type:* ]]; then
        # type:<id> or type:<id>:<days>
        local rest="${selector#type:}"
        local tid="${rest%%:*}"
        local age="${rest#*:}"
        if [[ "$age" == "$rest" || -z "$age" ]]; then
            # no age suffix - prompt
            read -r -p "Age in days (rows older than): " age
        fi
        if ! [[ "$tid" =~ ^[0-9]+$ && "$age" =~ ^[0-9]+$ ]]; then
            echo "Invalid type or age."
            return 1
        fi
        where="AuditType = $tid AND AuditDate < DATE_SUB(NOW(), INTERVAL $age DAY)"
    else
        echo "Unknown selector: $selector"
        return 1
    fi

    # Before metrics
    echo ""
    echo "Collecting before-metrics..."
    local total_before
    total_before=$(audit_count)
    local matched
    matched=$(mysql_exec "SELECT COUNT(*) FROM Audit WHERE $where;")
    echo "  Total Audit rows : $total_before"
    echo "  Rows to delete   : $matched"
    echo "  Selector         : $selector"

    if [[ "$matched" == "0" ]]; then
        echo "Nothing to prune."
        return 0
    fi

    if ! confirm "Proceed with delete?"; then
        echo "Cancelled."
        return 1
    fi

    # Delete in chunks so we can show progress and avoid lock-table blowups.
    # 10,000 rows per chunk is a reasonable default for InnoDB.
    local chunk=10000
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

    # After metrics
    echo "Collecting after-metrics..."
    local total_after
    total_after=$(audit_count)
    echo ""
    echo "  Before total : $total_before"
    echo "  After  total : $total_after"
    echo "  Deleted      : $deleted"
}

# ---------------------------------------------------------------------------
# Operation: backup database
# ---------------------------------------------------------------------------

# $1 optional backup dir, $2 optional "zip"|"nozip"
op_backup() {
    banner "BACKUP DATABASE ($ENV_LABEL / $DB_NAME)"

    local dest_dir="$1"
    local zip_flag="$2"

    if [[ -z "$dest_dir" ]]; then
        read -r -p "Backup directory [$DEFAULT_BACKUP_DIR]: " dest_dir
        dest_dir="${dest_dir:-$DEFAULT_BACKUP_DIR}"
    fi
    if [[ ! -d "$dest_dir" ]]; then
        mkdir -p "$dest_dir" || { echo "ERROR: cannot create $dest_dir"; return 1; }
    fi

    if [[ -z "$zip_flag" ]]; then
        if confirm "Compress the backup with zip?"; then
            zip_flag="zip"
        else
            zip_flag="nozip"
        fi
    fi

    local ts
    ts=$(date +"%F_%H-%M-%S")
    local sql_file="$dest_dir/${DB_NAME}.${ts}.sql"
    CURRENT_TMP_FILE="$sql_file"

    echo "Writing dump to: $sql_file"
    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --routines \
        --skip-lock-tables \
        --single-transaction \
        --result-file="$sql_file" \
        "$DB_NAME"
    local rc=$?
    if (( rc != 0 )); then
        echo "ERROR: mysqldump failed (rc=$rc)"
        return $rc
    fi

    if [[ "$zip_flag" == "zip" ]]; then
        local zip_file="${sql_file}.zip"
        echo "Compressing..."
        zip -j "$zip_file" "$sql_file" && rm -f "$sql_file"
        CURRENT_TMP_FILE=""
        echo "Backup: $zip_file"
        ls -lh "$zip_file"
    else
        CURRENT_TMP_FILE=""
        echo "Backup: $sql_file"
        ls -lh "$sql_file"
    fi
}

# ---------------------------------------------------------------------------
# Operation: optimize table
# ---------------------------------------------------------------------------

# $1 optional table name, $2 optional alt tmp dir (for @@tmpdir hint)
op_optimize() {
    banner "OPTIMIZE TABLE ($ENV_LABEL / $DB_NAME)"

    local table="$1"
    local tmpdir="$2"

    if [[ -z "$table" ]]; then
        read -r -p "Table name: " table
    fi
    if [[ -z "$table" ]]; then
        echo "ERROR: no table specified."
        return 1
    fi

    # Very basic name sanity check - identifiers are letters/digits/underscore.
    if ! [[ "$table" =~ ^[A-Za-z0-9_]+$ ]]; then
        echo "ERROR: invalid table name."
        return 1
    fi

    if [[ -z "$tmpdir" ]]; then
        read -r -p "Alternate tmp dir (blank for server default): " tmpdir
    fi

    # Note: MySQL/MariaDB does not let us change @@tmpdir at runtime for the
    # server, but InnoDB respects @@innodb_tmpdir which can be set per-session.
    local pre_sql=""
    if [[ -n "$tmpdir" ]]; then
        if [[ ! -d "$tmpdir" ]]; then
            echo "ERROR: tmp dir does not exist: $tmpdir"
            return 1
        fi
        pre_sql="SET SESSION innodb_tmpdir = '$tmpdir'; "
        echo "Using innodb_tmpdir = $tmpdir"
    fi

    echo "Size before:"
    mysql_exec "SELECT DATA_LENGTH, INDEX_LENGTH, DATA_FREE FROM information_schema.TABLES \
                WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table';"

    echo "Running OPTIMIZE TABLE $table ..."
    mysql_exec "${pre_sql}OPTIMIZE TABLE \`$table\`;"

    echo "Size after:"
    mysql_exec "SELECT DATA_LENGTH, INDEX_LENGTH, DATA_FREE FROM information_schema.TABLES \
                WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table';"
}

# ---------------------------------------------------------------------------
# Operation: metrics
# ---------------------------------------------------------------------------

# $1 optional table name. If blank, whole-database summary.
op_metrics() {
    banner "METRICS ($ENV_LABEL / $DB_NAME)"

    local table="$1"
    if [[ -z "$table" ]]; then
        read -r -p "Table name (blank for whole DB): " table
    fi

    if [[ -z "$table" ]]; then
        # Whole-database summary: per-table avg/total size
        echo "Per-table size (rows, avg row bytes, total bytes):"
        mysql_exec "\
            SELECT TABLE_NAME, TABLE_ROWS, AVG_ROW_LENGTH, \
                   (DATA_LENGTH + INDEX_LENGTH) AS TOTAL_BYTES \
            FROM information_schema.TABLES \
            WHERE TABLE_SCHEMA='$DB_NAME' \
            ORDER BY TOTAL_BYTES DESC;"
        return 0
    fi

    if ! [[ "$table" =~ ^[A-Za-z0-9_]+$ ]]; then
        echo "ERROR: invalid table name."
        return 1
    fi

    echo "Size summary for $table:"
    mysql_exec "\
        SELECT TABLE_ROWS AS rows_est, \
               AVG_ROW_LENGTH AS avg_row_bytes, \
               DATA_LENGTH AS data_bytes, \
               INDEX_LENGTH AS index_bytes, \
               (DATA_LENGTH + INDEX_LENGTH) AS total_bytes \
        FROM information_schema.TABLES \
        WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table';"

    # Max row size is approximated by DATA_LENGTH / TABLE_ROWS floor.
    # A true per-row max would require scanning every row, which is
    # expensive on big tables, so we skip it.

    # Age buckets - only meaningful for tables with a date column.
    # We look for a column named AuditDate, DateCreated, or Date*.
    local date_col
    date_col=$(mysql_exec "\
        SELECT COLUMN_NAME FROM information_schema.COLUMNS \
        WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table' \
          AND DATA_TYPE IN ('datetime','timestamp','date') \
        ORDER BY ORDINAL_POSITION LIMIT 1;")

    if [[ -n "$date_col" ]]; then
        echo ""
        echo "Row-age buckets (using column $date_col):"
        mysql_exec "\
            SELECT \
              SUM(CASE WHEN \`$date_col\` >= DATE_SUB(NOW(), INTERVAL 30 DAY)  THEN 1 ELSE 0 END) AS last_30d, \
              SUM(CASE WHEN \`$date_col\` <  DATE_SUB(NOW(), INTERVAL 30 DAY)  AND \`$date_col\` >= DATE_SUB(NOW(), INTERVAL 90 DAY)  THEN 1 ELSE 0 END) AS d30_90, \
              SUM(CASE WHEN \`$date_col\` <  DATE_SUB(NOW(), INTERVAL 90 DAY)  AND \`$date_col\` >= DATE_SUB(NOW(), INTERVAL 180 DAY) THEN 1 ELSE 0 END) AS d90_180, \
              SUM(CASE WHEN \`$date_col\` <  DATE_SUB(NOW(), INTERVAL 180 DAY) AND \`$date_col\` >= DATE_SUB(NOW(), INTERVAL 365 DAY) THEN 1 ELSE 0 END) AS d180_365, \
              SUM(CASE WHEN \`$date_col\` <  DATE_SUB(NOW(), INTERVAL 365 DAY) AND \`$date_col\` >= DATE_SUB(NOW(), INTERVAL 730 DAY) THEN 1 ELSE 0 END) AS d365_730, \
              SUM(CASE WHEN \`$date_col\` <  DATE_SUB(NOW(), INTERVAL 730 DAY) THEN 1 ELSE 0 END) AS over_2y \
            FROM \`$table\`;"
    else
        echo ""
        echo "(No datetime column found on $table - skipping age buckets.)"
    fi
}

# ---------------------------------------------------------------------------
# Environment + operation selection (interactive)
# ---------------------------------------------------------------------------

select_env_interactive() {
    echo ""
    echo "[1] Production"
    echo "[2] Staging"
    read -r -p "Environment: " choice
    case "$choice" in
        1) ENVIRONMENT="prod" ;;
        2) ENVIRONMENT="staging" ;;
        *) echo "Invalid."; exit 1 ;;
    esac
}

main_menu() {
    clear
    banner "PACKRAT DATABASE OPS"
    echo "Environment: $ENV_LABEL ($DB_NAME @ $DB_HOST)"
    echo ""
    # Drop / rebuild are staging-only. On production they are not shown
    # at all - those operations must be performed manually by an operator.
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
    read -r -p "Choose: " c
    case "$c" in
        1)
            if [[ "$ENVIRONMENT" != "staging" ]]; then
                echo "Drop is staging-only."; return 1
            fi
            op_drop
            ;;
        2)
            if [[ "$ENVIRONMENT" != "staging" ]]; then
                echo "Rebuild is staging-only."; return 1
            fi
            op_rebuild
            ;;
        3) op_prune ;;
        4) op_backup ;;
        5) op_optimize ;;
        6) op_metrics ;;
        [Qq]) exit 0 ;;
        *) echo "Invalid."; return 1 ;;
    esac
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

# Normalize the first positional argument (env) if provided.
case "$1" in
    prod|production) ENVIRONMENT="prod"; shift ;;
    staging|stage)   ENVIRONMENT="staging"; shift ;;
    "")              ;;  # interactive - select below
    -h|--help)
        sed -n '2,30p' "$0"   # print the header comment
        exit 0
        ;;
    *)
        echo "Unknown environment: $1"
        echo "Use: prod | staging   (or no args for interactive)"
        exit 1
        ;;
esac

# If no env chosen via CLI, prompt.
if [[ -z "$ENVIRONMENT" ]]; then
    select_env_interactive
fi

# Load creds / paths for the chosen environment.
if ! load_credentials; then
    exit 1
fi

# Dispatch: CLI op if given, otherwise interactive menu.
OP="$1"; shift 2>/dev/null

status="OK"
if [[ -n "$OP" ]]; then
    # Enforce staging-only ops at the dispatch layer too, so CLI callers
    # can't bypass the interactive menu gating.
    if [[ "$ENVIRONMENT" == "prod" && ( "$OP" == "drop" || "$OP" == "rebuild" ) ]]; then
        echo "ERROR: '$OP' is not permitted on production from this script."
        echo "Run it manually if truly required."
        status="FAIL"
        OP=""   # skip the dispatch below
    fi

    case "$OP" in
        drop)     op_drop     "$@" ;;
        rebuild)  op_rebuild  "$@" ;;
        prune)    op_prune    "$@" ;;
        backup)   op_backup   "$@" ;;
        optimize) op_optimize "$@" ;;
        metrics)  op_metrics  "$@" ;;
        "")       ;;  # blocked above
        *) echo "Unknown op: $OP"; status="FAIL"; ;;
    esac
    rc=$?
    if (( rc != 0 )); then status="FAIL"; fi
else
    main_menu
    rc=$?
    if (( rc != 0 )); then status="FAIL"; fi
fi

print_summary "$status"
exit 0
