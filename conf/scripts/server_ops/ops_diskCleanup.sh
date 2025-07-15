#!/bin/bash

usage() {
    echo "Usage: $0 [--dry-run] [--ignore-recent] <path_prefix>"
    exit 1
}

# Flags
dry_run=false
ignore_recent=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            dry_run=true
            shift
            ;;
        --ignore-recent)
            ignore_recent=true
            shift
            ;;
        *)
            path_prefix="$1"
            shift
            ;;
    esac
done

if [ -z "$path_prefix" ]; then
    usage
fi

total_files=0
total_size=0

echo ""
if $dry_run; then
    echo "=== DRY RUN: Listing deleted files under $path_prefix ==="
else
    echo "=== DELETING deleted files under $path_prefix ==="
fi
echo ""

# Run lsof and process deleted files under the path
lsof -nP -F pufsn +L1 2>/dev/null | awk -v prefix="$path_prefix" -v dry="$dry_run" -v recent="$ignore_recent" '
BEGIN {
    pid = ""; fd = ""; size = ""; name = "";
}
{
    if ($0 ~ /^p/) pid = substr($0, 2);
    else if ($0 ~ /^f/) fd = substr($0, 2);
    else if ($0 ~ /^u/) user = substr($0, 2);
    else if ($0 ~ /^s/) size = substr($0, 2);
    else if ($0 ~ /^n/) {
        name = substr($0, 2);
        if (name ~ /\(deleted\)$/ && name ~ "^"prefix) {
            gsub(/ \(deleted\)$/, "", name);

            # Check age if requested
            if (recent == "true") {
                cmd = "stat -Lc %Y /proc/" pid "/fd/" fd " 2>/dev/null";
                cmd | getline mod_time;
                close(cmd);

                cmd = "date +%s";
                cmd | getline now_time;
                close(cmd);

                age_days = int((now_time - mod_time) / 86400);
                if (age_days < 2) {
                    print "Skipping recent file: " name " (PID: " pid ", FD: " fd ", Age: " age_days " days)";
                    next;
                }
            }

            # Dry run: list
            if (dry == "true") {
                print "Would release: " name " (PID: " pid ", FD: " fd ", Size: " size ")";
            } else {
                cmd = "truncate -s 0 /proc/" pid "/fd/" fd " 2>/dev/null || : > /proc/" pid "/fd/" fd " 2>/dev/null";
                system(cmd);
                print "Releasing: " name " (PID: " pid ", FD: " fd ")";
            }

            total_files++;
            total_size += size;
        }
    }
}
END {
    # Human-readable output
    split("B KB MB GB TB", units);
    s = total_size;
    for (u = 1; s >= 1024 && u < 5; u++) s /= 1024;
    hr = sprintf("%.2f %s", s, units[u]);

    print "";
    print "-------------------------------";
    if (dry == "true")
        print "Total files matching: " total_files "\nTotal space that would be released: " hr;
    else
        print "Total files released: " total_files "\nTotal space reclaimed: " hr;
    print "-------------------------------";
}
'
