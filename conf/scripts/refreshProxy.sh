#!/usr/bin/env bash
# Deploy the Packrat nginx config + maintenance/canary assets from the repo to their
# runtime locations, then validate and reload nginx. Safe to re-run. Can be run from
# anywhere (paths are resolved relative to this script).
#
# Synced from the repo (source of truth):
#   conf/nginx/nginx-prod.conf              -> /etc/nginx/nginx.conf
#   conf/nginx/conf.d/common-locations-*    -> /etc/nginx/conf.d/
#   conf/nginx/conf.d/maintenance           -> /etc/nginx/conf.d/   (secret preserved)
#   conf/nginx/conf.d/staging-canary        -> /etc/nginx/conf.d/   (secret preserved)
#   conf/nginx/maintenance/*.html           -> /usr/share/nginx/maintenance/
#   conf/scripts/server_ops/*.sh            -> marked executable in place (run from repo)
#
# Left host-local (NOT touched here):
#   /etc/nginx/conf.d/zabbix.conf           per-host server_name, seeded at box build
#   /etc/nginx/maintenance.on, staging-canary.on   flag files (ops_*.sh toggles)
#   secret bypass/canary tokens             set on the box; carried across the copy below
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NGINX_SRC="$REPO_ROOT/conf/nginx"
OPS_SRC="$REPO_ROOT/conf/scripts/server_ops"
MAINT_DIR="/usr/share/nginx/maintenance"

# Copy a secret-bearing conf.d snippet while carrying forward the token an admin set
# on the box. The committed snippet ships a CHANGE_ME_* placeholder; without this, the
# copy would reset the live secret back to that placeholder. $1 src, $2 dest, $3 the
# nginx cookie variable name (e.g. cookie_maint_bypass), $4 the placeholder value.
copy_preserving_token() {
    local src="$1" dest="$2" var="$3" placeholder="$4" current=""
    if [ -f "$dest" ]; then
        current="$(sudo sed -nE "s/.*${var}[^\"]*\"([^\"]*)\".*/\1/p" "$dest" 2>/dev/null | head -n1)"
    fi
    sudo cp -v "$src" "$dest"
    if [ -n "$current" ] && [ "$current" != "$placeholder" ]; then
        sudo sed -i -E "s#(${var}[^\"]*\")[^\"]*(\")#\1${current}\2#" "$dest"
        echo "  (kept existing ${var} token on the box)"
    fi
}

echo "== nginx.conf =="
sudo cp -v "$NGINX_SRC/nginx-prod.conf" /etc/nginx/nginx.conf

echo "== conf.d location includes =="
sudo cp -v "$NGINX_SRC/conf.d/common-locations-prod" /etc/nginx/conf.d/common-locations-prod
sudo cp -v "$NGINX_SRC/conf.d/common-locations-dev" /etc/nginx/conf.d/common-locations-dev

echo "== conf.d maintenance + staging-canary (secrets preserved) =="
copy_preserving_token "$NGINX_SRC/conf.d/maintenance" /etc/nginx/conf.d/maintenance cookie_maint_bypass CHANGE_ME_BYPASS_TOKEN
copy_preserving_token "$NGINX_SRC/conf.d/staging-canary" /etc/nginx/conf.d/staging-canary cookie_staging_canary CHANGE_ME_CANARY_TOKEN

sudo chmod 644 /etc/nginx/conf.d/common-locations-prod /etc/nginx/conf.d/common-locations-dev /etc/nginx/conf.d/maintenance /etc/nginx/conf.d/staging-canary

echo "== maintenance / fallback pages =="
sudo mkdir -p "$MAINT_DIR"
sudo cp -v "$NGINX_SRC"/maintenance/*.html "$MAINT_DIR"/
sudo chmod 755 "$MAINT_DIR"
sudo chmod 644 "$MAINT_DIR"/*.html

# SELinux relabel so nginx can read config + serve the pages; no-op on non-SELinux hosts.
if command -v restorecon >/dev/null 2>&1; then
    echo "== SELinux relabel =="
    sudo restorecon -Rv /etc/nginx "$MAINT_DIR" || true
fi

echo "== ops scripts executable (run in place from the repo) =="
sudo chmod +x "$OPS_SRC"/*.sh

echo "== validate =="
sudo nginx -t

echo "== reload =="
sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload

echo "== status =="
sudo systemctl status nginx --no-pager 2>/dev/null || sudo service nginx status --no-pager

# Use the command below to stop if you're getting nginx: [emerg] bind() to 0.0.0.0:80 failed
# sudo fuser -k 80/tcp
