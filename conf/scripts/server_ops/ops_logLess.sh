#!/bin/bash
# Linux Server helper script that opens Packrat's structured JSON logs into LESS
# Usage:
#     ops_logLess.sh /3ddigip01/Packrat/Logs                                    // finds the most recent log file to open
#     ops_logLess.sh /3ddigip01/Packrat/Logs/2024/09/PackratLog_2024-09-26.log  // opens a specific log file

# Function to apply color based on custom log levels
colorize_level() {
  local level="$1"
  case "$level" in
    "crit")   echo -e "\033[1;35m${level}\033[0m" ;;   # Bold Magenta (crit)
    "error")  echo -e "\033[1;31m${level}\033[0m" ;;   # Bold Red (error)
    "warn")   echo -e "\033[1;33m${level}\033[0m" ;;   # Bold Yellow (warn)
    "info")   echo -e "\033[36m${level}\033[0m" ;;     # Cyan (info)
    "debug")  echo -e "\033[90m${level}\033[0m" ;;     # Gray (debug)
    "perf")   echo -e "\033[32m${level}\033[0m" ;;     # Green (perf)
    *)        echo "$level" ;;                         # No color for other levels
  esac
}

# Function to dim the data field
dim_data() {
  local data="$1"
  echo -e "\033[90m${data}\033[0m"  # 033[2m for dimming, 033[0m to reset
}

# Function to strip ANSI color codes for correct padding calculation
strip_ansi() {
  echo "$1" | sed 's/\x1b\[[0-9;]*m//g'
}

# Function to parse JSON and format the output in a single line
process_line() {
  local line="$1"
  
  # Extract fields from JSON using jq
  timestamp=$(echo "$line" | jq -r '.timestamp')
  requestId=$(echo "$line" | jq -r '.context.idRequest // "00000"')
  userId=$(echo "$line" | jq -r '.context.idUser // "----"')
  section=$(echo "$line" | jq -r '.context.section // "-----"')
  level=$(echo "$line" | jq -r '.level | ascii_downcase')
  message=$(echo "$line" | jq -r '.message')
  caller=$(echo "$line" | jq -r '.context.caller // ""')

  # Stringify the data field, forcing it to be displayed in a single line
  data=$(echo "$line" | jq -c '.data // ""')

  # Format requestId with leading zeros
  requestId=$(printf "%05d" "$requestId")

  # Check if userId is numeric, and format accordingly (U---- for non-numeric)
  if [[ "$userId" =~ ^[0-9]+$ ]]; then
    userId=$(printf "U%04d" "$userId")  # Pad user ID to 4 digits (U0000)
  else
    userId="U----"  # Default if userId is not numeric
  fi

  # Calculate padding for the section (maximum 5 characters)
  section=$(printf "%-5s" "$section")

  # Colorize log level
  colored_level=$(colorize_level "$level")

  # Strip ANSI codes to calculate the padding correctly for level
  raw_level=$(strip_ansi "$colored_level")
  level_pad=$(printf "%*s" $((5 - ${#raw_level})) "")

  # Format data field if it exists
  if [ -n "$data" ] && [ "$data" != "\"\"" ]; then
    data=$(dim_data "($data)")  # Apply dimming to the data field
  else
    data=""
  fi

  # Format the timestamp and output the log line in a single line
  timestamp=$(echo "$timestamp" | sed -e 's/T/ /' -e 's/\..*//')
  echo -e "${timestamp} [${requestId}] ${userId} ${section} ${level_pad}${colored_level}: [${caller}] ${message} ${data}"
}

# Function to get the most recent log file based on date
get_most_recent_log() {
  local log_root="$1"
  find "$log_root" -type f -name "*.log" | sort | tail -n 1
}

# Main script logic
if [ -z "$1" ]; then
  echo "Usage: $0 <log_root_folder>"
  exit 1
fi

log_path="$1"
log_file=""

# Check if the argument is a folder or a file
if [ -d "$log_path" ]; then
  # If it's a directory, find the most recent log file
  log_file=$(get_most_recent_log "$log_path")
  if [ -z "$log_file" ]; then
    echo "No log file found in the specified folder."
    exit 1
  fi
elif [ -f "$log_path" ]; then
  # If it's a file, use it directly
  log_file="$log_path"
else
  echo "The specified path is not valid."
  exit 1
fi

echo "Loading log file into less: $log_file"

# Process the entire log file and pipe the result to less
cat "$log_file" | while read -r line; do
  process_line "$line"
done | less -R

