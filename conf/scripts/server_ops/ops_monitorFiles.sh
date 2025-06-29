#!/bin/bash

# Prompt the user for the directory to monitor
read -p "Enter the directory to monitor for file activity: " MONITORED_DIR

# Check if the directory exists
if [[ ! -d "$MONITORED_DIR" ]]; then
    echo "Error: Directory '$MONITORED_DIR' does not exist."
    exit 1
fi

# Function to clean up and exit the script
cleanup() {
    echo "Exiting monitoring..."
    exit 0
}

# Set trap to handle 'Ctrl+C' key press to exit the script
trap cleanup SIGINT SIGTERM

# Start monitoring the provided directory for file activity using lsof
echo "Monitoring directory: $MONITORED_DIR for file activity"
echo "Press 'Ctrl+C' to exit the monitoring."

# Continuously monitor the directory and its subdirectories with lsof, appending new results every 2 seconds
while : ; do
    echo "------------------------------------------"
    echo "File activity in $MONITORED_DIR (updated at $(date)):"
    lsof +D "$MONITORED_DIR"
    echo "------------------------------------------"
    sleep 2
done

