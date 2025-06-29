#!/bin/bash

LOG_BASE_PROD="/3ddigip01/Packrat/Logs"
LOG_BASE_DEV="/3ddigip01/Packrat/Logs-Dev"
TAIL_SCRIPT="/data/Packrat/Scripts/ops_logTail.sh"
LESS_SCRIPT="/data/Packrat/Scripts/ops_logLess.sh"

disk_cleanup_menu() {
    echo ""
    echo "Disk Cleanup Options:"
    echo "[1] /staging"
    echo "[2] Custom path"
    read -p "Choose an option: " CLEAN_CHOICE

    case "$CLEAN_CHOICE" in
        1)
            CLEAN_PATH="/staging"
            ;;
        2)
            read -p "Enter full path to clean: " CUSTOM_PATH
            if [[ -z "$CUSTOM_PATH" || ! -d "$CUSTOM_PATH" ]]; then
                echo "Invalid directory: $CUSTOM_PATH"
                pause_and_return
            fi
            CLEAN_PATH="$CUSTOM_PATH"
            ;;
        *)
            echo "Invalid choice."
            pause_and_return
            ;;
    esac

    echo ""
    read -p "Dry run? (List files only, no delete) [y/N]: " DRY_CONFIRM
    DRY_FLAG=""
    if [[ "$DRY_CONFIRM" =~ ^[Yy]$ ]]; then
        DRY_FLAG="--dry-run"
    fi

    echo ""
    read -p "Protect recent files (last 2 days)? [Y/n]: " RECENT_CONFIRM
    IGNORE_RECENT_FLAG="--ignore-recent"
    if [[ "$RECENT_CONFIRM" =~ ^[Nn]$ ]]; then
        IGNORE_RECENT_FLAG=""
    fi

    echo ""
    if [[ -z "$DRY_FLAG" ]]; then
        echo "⚠️  WARNING: This will permanently delete files from: $CLEAN_PATH"
        read -p "Are you sure you want to continue? [y/N]: " CONFIRM
        if ! [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
            echo "Cancelled."
            pause_and_return
            return
        fi
    fi

    echo "Running disk cleanup: $CLEAN_PATH"
    /data/Packrat/Scripts/ops_diskCleanup.sh $DRY_FLAG $IGNORE_RECENT_FLAG "$CLEAN_PATH"

    pause_and_return
}

main_menu() {
    clear
    echo "*****************************************************"
    echo "PACKRAT OPS MENU"
    echo "*****************************************************"
    echo "[1] Tail Log"
    echo "[2] View Log (less)"
    echo "[3] System Monitor"
    echo "[4] Disk Cleanup"
    echo "[Q] Quit"
    echo ""

    read -p "Choose an option: " MAIN_CHOICE

    case "$MAIN_CHOICE" in
        1) log_menu "tail" ;;
        2) log_menu "less" ;;
        3) /data/Packrat/Scripts/ops_monitor.sh ;;
        4) disk_cleanup_menu ;;
        [Qq]) echo "Goodbye!"; exit 0 ;;
        *) echo "Invalid option."; pause_and_return ;;
    esac
}

log_menu() {
    ACTION=$1
    SCRIPT=""
    case "$ACTION" in
        tail) SCRIPT="$TAIL_SCRIPT" ;;
        less) SCRIPT="$LESS_SCRIPT" ;;
    esac

    echo ""
    echo "[1] Production"
    echo "[2] Staging"
    read -p "Choose environment: " ENV

    case "$ENV" in
        1) BASE_PATH="$LOG_BASE_PROD" ;;
        2) BASE_PATH="$LOG_BASE_DEV" ;;
        *) echo "Invalid environment."; pause_and_return ;;
    esac

    echo ""
    echo "[1] Latest"
    echo "[2] Specific Date"
    read -p "Choose log option: " LOG_OPTION

    case "$LOG_OPTION" in
        1)
            echo "Launching latest log..."
            YEAR=$(date +%Y)
            "$SCRIPT" "$BASE_PATH/$YEAR"
            ;;
        2)
            read -p "Enter date (YYYY-MM-DD): " DATE
            if [[ ! "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
                echo "Invalid date format."
                pause_and_return
            fi
            YEAR=$(echo "$DATE" | cut -d'-' -f1)
            MONTH=$(echo "$DATE" | cut -d'-' -f2)
            LOG_PATH="$BASE_PATH/$YEAR/$MONTH/PackratLog_${DATE}.log"
            echo "Opening log: $LOG_PATH"
            "$SCRIPT" "$LOG_PATH"
            ;;
        *) echo "Invalid log option."; pause_and_return ;;
    esac

    pause_and_return
}

pause_and_return() {
    echo ""
    read -p "Press [Enter] to return to the main menu..." dummy
    main_menu
}

# Start the menu
main_menu

