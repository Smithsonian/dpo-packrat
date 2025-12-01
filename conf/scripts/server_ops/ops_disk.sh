#!/bin/bash

clear

# Directories to monitor
monitor_dirs=(
    "/staging/Packrat/Storage-Dev/tmp"
    "/data/Packrat/Temp/docker/overlay2"
)

# Filesystem to monitor
monitor_filesystems=(
    "/data"
    "/staging"
)

# Function to move the cursor to the top of the screen
move_cursor_to_top() {
    echo -e "\033[H"
}

# Function to get disk usage of directories
get_disk_usage() {
    for dir in "${monitor_dirs[@]}"; do
        if [ -d "$dir" ]; then
            used_space=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')
            echo -e "Used space in $dir: $used_space"
        else
            echo -e "Directory $dir does not exist."
        fi
    done
}

# Function to get available and used space of filesystems
get_filesystem_usage() {
    for fs in "${monitor_filesystems[@]}"; do
        if mountpoint -q "$fs"; then
            df -h "$fs" | awk 'NR==2 {print "Filesystem " $1 ": " $3 " used, " $4 " available"}'
        else
            echo -e "Filesystem $fs is not mounted."
        fi
    done
}

# Loop to update disk usage in real-time
while true; do
    move_cursor_to_top
    echo "Disk Usage Monitoring (real-time update)"
    echo "========================================"

    echo "Filesystem Usage:"
    get_filesystem_usage
    echo
    
    echo "Directory Usage:"
    # get_disk_usage
    echo

    # Update every 5 seconds
    sleep 20
done
