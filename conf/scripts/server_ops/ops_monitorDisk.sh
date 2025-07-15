#!/bin/bash

# Function to display usage information
usage() {
    echo "Usage: $0 /path/to/directory"
    exit 1
}

# Check if inotifywait is installed
if ! command -v inotifywait &> /dev/null; then
    echo "Error: inotifywait is not installed."
    echo "Please install it with 'sudo apt-get install inotify-tools'"
    exit 1
fi

# Check if the user provided a directory
if [ -z "$1" ]; then
    usage
fi

DIRECTORY=$1

# Check if the provided argument is a valid directory
if [ ! -d "$DIRECTORY" ]; then
    echo "Error: $DIRECTORY is not a valid directory."
    usage
fi

# Function to print a timestamped divider every 10 seconds
divider() {
    while true; do
        echo -e "\n--- Monitoring update at $(date '+%Y-%m-%d %H:%M:%S') ---"
        sleep 10
    done
}

# Start divider in the background
divider &

# Use inotifywait to monitor the directory continuously for file creation, modification, and deletion
# inotifywait -r -m -e create -e modify -e delete --format '%T %w %f %e' --timefmt '%Y-%m-%d %H:%M:%S' "$DIRECTORY" | while read TIME DIR FILE EVENT
inotifywait -r -m -e create -e delete --format '%T %w %f %e' --timefmt '%Y-%m-%d %H:%M:%S' "$DIRECTORY" | while read TIME DIR FILE EVENT
do
    case "$EVENT" in
        CREATE)
            echo "$TIME - File: $DIR$FILE - Event: CREATED"
            ;;
#        MODIFY)
#            echo "$TIME - File: $DIR$FILE - Event: MODIFIED"
#            ;;
        DELETE)
            echo "$TIME - File: $DIR$FILE - Event: DELETED"
            ;;
        *)
            echo "$TIME - File: $DIR$FILE - Event: $EVENT"
            ;;
    esac
done

