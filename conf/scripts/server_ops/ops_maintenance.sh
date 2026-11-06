#!/usr/bin/env bash
# Toggle the Packrat nginx maintenance page (flag-file driven; no reload needed).
#
#   ops_maintenance.sh on "reason text"   raise the flag -> 503 planned page for all
#                                         clients except holders of the bypass cookie
#   ops_maintenance.sh off                lower the flag  -> normal serving (502/504
#                                         fallback still covers an app outage)
#   ops_maintenance.sh status             print the current state
#
# The flag is a plain file whose existence nginx tests per request, so on/off take
# effect immediately with no nginx reload. Unplanned upstream failures are handled by
# nginx's error_page independently of this flag.
set -euo pipefail

FLAG="/etc/nginx/maintenance.on"
HTML_DIR="/usr/share/nginx/maintenance"
TEMPLATE="${HTML_DIR}/maint-planned.template.html"
SERVED="${HTML_DIR}/maint-planned.html"

cmd="${1:-status}"

case "$cmd" in
    on)
        reason="${2:-We'll be back shortly. Thank you for your patience.}"
        stamp="$(date '+%Y-%m-%d %H:%M %Z')"
        if [ -f "$TEMPLATE" ]; then
            sed -e "s#%%REASON%%#${reason}#g" -e "s#%%TIME%%#${stamp}#g" "$TEMPLATE" > "$SERVED"
            restorecon "$SERVED" 2>/dev/null || true
        fi
        touch "$FLAG"
        echo "maintenance ON — ${reason}"
        ;;
    off)
        rm -f "$FLAG"
        echo "maintenance OFF"
        ;;
    status)
        if [ -f "$FLAG" ]; then echo "maintenance ON"; else echo "maintenance OFF"; fi
        ;;
    *)
        echo "usage: $0 {on \"reason\"|off|status}" >&2
        exit 2
        ;;
esac
