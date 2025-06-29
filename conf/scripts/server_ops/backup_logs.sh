#!/bin/bash

ARG1="$1"

main() {
    clear
    echo "*****************************************************"
    echo "PACKRAT: DAILY LOG BACKUP"
    echo "*****************************************************"

    # Determine environment
    if [[ -z "$ARG1" ]]; then
        echo ""
        echo "[1] Production"
        echo "[2] Staging"
        echo ""
        read -p "What environment: " ENVIRONMENT
    else
        ENVIRONMENT="$ARG1"
        echo "Environment: $ENVIRONMENT"
    fi

    # Normalize environment selection
    case "$ENVIRONMENT" in
        1|Production|production)
            LOG_DIR="Logs"
            ENV_NAME="Production"
            ;;
        2|Staging|staging)
            LOG_DIR="Logs-Dev"
            ENV_NAME="Staging"
            ;;
        *)
            echo "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    # Use yesterday's date to ensure we catch end-of-month transitions
    YESTERDAY=$(date -u -d "yesterday" +%Y-%m-%d)
    YEAR=$(date -u -d "$YESTERDAY" +%Y)
    MONTH=$(date -u -d "$YESTERDAY" +%m)
    DATE_PREFIX="$YEAR-$MONTH"

    # Define paths
    SRC_PATH="/3ddigip01/Packrat/${LOG_DIR}/$YEAR/$MONTH"
    DST_PATH="/3ddigip01/Packrat/Backups/Logs/$YEAR/$ENV_NAME"
    ARCHIVE_FILENAME="$DST_PATH/PackratLogs_${DATE_PREFIX}.zip"
    FILE="$SRC_PATH/PackratLog_${YESTERDAY}.log"

    echo ""
    echo "Looking for log:     $FILE"
    echo "Saving to archive:   $ARCHIVE_FILENAME"

    mkdir -p "$DST_PATH"
    shopt -s nullglob

    if [[ -f "$FILE" ]]; then
        echo "Archiving: $(basename "$FILE")"
        zip -uq "$ARCHIVE_FILENAME" "$FILE"
        if [[ $? -eq 0 ]]; then
            echo "✓ Archived: $FILE"
        else
            echo "⚠️ Failed to archive: $FILE"
        fi
    else
        echo "No log file found for $YESTERDAY"
    fi

    echo "✅ Daily backup complete for $ENV_NAME — processed $YESTERDAY"
}

main

