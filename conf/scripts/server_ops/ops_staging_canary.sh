#!/usr/bin/env bash
# Toggle the Packrat staging canary (flag-file driven; no nginx reload for on/off).
#
#   ops_staging_canary.sh on             arm the canary -> sessions carrying the
#                                         secret staging_canary cookie route to the
#                                         new box; everyone else stays on old staging
#   ops_staging_canary.sh off            disarm -> every session back to old staging
#                                         immediately, cookie or not (master revoke)
#   ops_staging_canary.sh status         print the current state
#   ops_staging_canary.sh rotate <token> set a new secret token in the conf.d snippet,
#                                         validate, and reload (revokes every current
#                                         opted-in session at once)
#
# The flag is a plain file whose existence nginx tests per request, so on/off take
# effect immediately with no reload. The flag must exist ONLY on the old box — the
# shared nginx config is inert without it (no self-proxy loop on the new box).
set -euo pipefail

FLAG="/etc/nginx/staging-canary.on"
SNIPPET="/etc/nginx/conf.d/staging-canary"

cmd="${1:-status}"

case "$cmd" in
    on)
        touch "$FLAG"
        echo "canary ARMED — opted-in (cookie) sessions route to the new box"
        ;;
    off)
        rm -f "$FLAG"
        echo "canary OFF — all sessions on old staging"
        ;;
    status)
        if [ -f "$FLAG" ]; then echo "canary ARMED"; else echo "canary OFF"; fi
        ;;
    rotate)
        token="${2:-}"
        if [ -z "$token" ]; then
            echo "usage: $0 rotate <token>" >&2
            exit 2
        fi
        # '#' is the sed delimiter and '\"' terminates the token string, so disallow
        # both; keep the token to shell/cookie-safe characters.
        case "$token" in
            *'#'*|*'"'*) echo "token must not contain '#' or '\"'" >&2; exit 2 ;;
        esac
        if [ ! -f "$SNIPPET" ]; then
            echo "snippet not found: $SNIPPET" >&2
            exit 1
        fi
        cp -a "$SNIPPET" "${SNIPPET}.bak"
        sed -i -E "s#(cookie_staging_canary != \")[^\"]*(\")#\1${token}\2#" "$SNIPPET"
        restorecon "$SNIPPET" 2>/dev/null || true
        if nginx -t; then
            nginx -s reload
            rm -f "${SNIPPET}.bak"
            echo "canary token rotated — all prior opted-in sessions revoked"
        else
            mv -f "${SNIPPET}.bak" "$SNIPPET"
            echo "nginx -t failed; token change reverted, no reload" >&2
            exit 1
        fi
        ;;
    *)
        echo "usage: $0 {on|off|status|rotate <token>}" >&2
        exit 2
        ;;
esac
