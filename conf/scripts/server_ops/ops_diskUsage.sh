#!/bin/bash

# Function to display the header
display_header() {
    printf "%-15s %-10s %-10s %-10s\n" "Drive" "Used" "Available" "% Used"
    echo -e "---------------------------------------------"
}

# Function to display storage for /data and /staging
display_storage() {
    df -h | grep -E "(/data$|/staging$)" | awk '{printf "%-15s %-10s %-10s %-10s\n", $6, $3, $4, $5}'
}

# Function to check additional folder with du if provided
check_folder_storage() {
    if [ ! -z "$folder" ]; then
        folder_size=$(du -sh "$folder" 2>/dev/null | awk '{print $1}')
        if [ -z "$folder_size" ]; then
            echo -e "\nFolder '$folder' does not exist or cannot be accessed."
        else
            echo -e "\nFolder '$folder' size: $folder_size"
        fi
    fi
}

# Function to display the timestamp of the last update
display_timestamp() {
    echo -e "\nLast updated: $(date +"%Y-%m-%d %H:%M:%S")"
}

# Ask the user for an optional folder to check with du
read -p "Enter the path to a folder to check (or press enter to skip): " folder

# Main loop to update every 10 seconds
while true; do
    clear
    display_header
    display_storage
    check_folder_storage
    display_timestamp
    sleep 10
done

