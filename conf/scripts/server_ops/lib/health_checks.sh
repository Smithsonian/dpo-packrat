#!/bin/bash
#
# lib/health_checks.sh - read-only system health probes
#
# Sourced by ops_health.sh, ops_hardware.sh, ops_network.sh (after common.sh).
# Not meant to be executed directly.
#
# Every probe:
#   - is NON-MUTATING (safe to run any time, in cron, during incidents)
#   - reports exactly one line via hc_report <name> <PASS|WARN|FAIL|SKIP> <msg>
#   - degrades to SKIP (never a false FAIL) when a tool or path is absent
#   - returns 0 so a caller's `set -e`/loop is never aborted mid-roll-up
#
# Verdict taxonomy (Nagios-style): PASS=ok, WARN=soft/degraded, FAIL=broken,
# SKIP=not-applicable. hc_summary returns the worst seen: 0 ok / 1 warn / 2 fail.
#

if [[ -n "${__PACKRAT_LIB_HEALTH_SOURCED:-}" ]]; then
    return 0
fi
__PACKRAT_LIB_HEALTH_SOURCED=1

# ---------------------------------------------------------------------------
# Tunables (override via the sibling .env or the environment)
# ---------------------------------------------------------------------------

HEALTH_CONNECT_TIMEOUT="${HEALTH_CONNECT_TIMEOUT:-5}"
HEALTH_DISK_WARN_PCT="${HEALTH_DISK_WARN_PCT:-80}"
HEALTH_DISK_FAIL_PCT="${HEALTH_DISK_FAIL_PCT:-90}"
HEALTH_LOCAL_FS="${HEALTH_LOCAL_FS:-/ /var /staging /staging/docker /rdbms /data}"
HEALTH_NFS_MOUNTS="${HEALTH_NFS_MOUNTS:-/3ddigip01 /data/Packrat/digitization}"
HEALTH_LINK_IGNORE="${HEALTH_LINK_IGNORE:-}"   # NIC names to never flag as down (unused ports)
HEALTH_EXPECT_BONDS="${HEALTH_EXPECT_BONDS:-}"  # non-empty => NIC bonds are expected (warn if absent)
HEALTH_EGRESS_TARGETS="${HEALTH_EGRESS_TARGETS:-ldaps.si.edu:636 edan.si.edu:443 si-3dcook02.us.sinet.si.edu:8000 smtp.si.edu:25 slack.com:443}"
HEALTH_SOLR_PORT="${HEALTH_SOLR_PORT:-${PACKRAT_SOLR_PORT:-8983}}"
HEALTH_SERVER_PORT="${HEALTH_SERVER_PORT:-${PACKRAT_SERVER_PORT:-4000}}"
# When 1, PASS/SKIP lines are tallied but not printed (summary + problems only).
HEALTH_QUIET="${HEALTH_QUIET:-0}"

# ---------------------------------------------------------------------------
# Tally + reporter
# ---------------------------------------------------------------------------

HC_PASS=0; HC_WARN=0; HC_FAIL=0; HC_SKIP=0
HC_WORST=0   # 0 ok, 1 warn, 2 fail

hc_reset() { HC_PASS=0; HC_WARN=0; HC_FAIL=0; HC_SKIP=0; HC_WORST=0; }

hc_report() {
    local name="$1" st="$2" msg="${3:-}"
    case "$st" in
        PASS) HC_PASS=$((HC_PASS+1)) ;;
        WARN) HC_WARN=$((HC_WARN+1)); if [[ $HC_WORST -lt 1 ]]; then HC_WORST=1; fi ;;
        FAIL) HC_FAIL=$((HC_FAIL+1)); HC_WORST=2 ;;
        SKIP) HC_SKIP=$((HC_SKIP+1)) ;;
        *)    HC_SKIP=$((HC_SKIP+1)); st="SKIP" ;;
    esac
    if [[ "$HEALTH_QUIET" == 1 && ( "$st" == PASS || "$st" == SKIP ) ]]; then
        return 0
    fi
    printf '  [%-4s] %-16s %s\n' "$st" "$name" "$msg"
    return 0
}

# hc_summary [label] - print the tally + overall verdict; return 0/1/2.
hc_summary() {
    local label="${1:-HEALTH}"
    echo ""
    hr
    printf '%-9s: %d pass, %d warn, %d fail, %d skip\n' \
        "$label" "$HC_PASS" "$HC_WARN" "$HC_FAIL" "$HC_SKIP"
    case "$HC_WORST" in
        0) echo "OVERALL  : OK" ;;
        1) echo "OVERALL  : WARN" ;;
        *) echo "OVERALL  : FAIL" ;;
    esac
    hr
    return "$HC_WORST"
}

# hc_tcp host port - 0 if a TCP connect succeeds within the timeout.
hc_tcp() {
    local host="$1" port="$2"
    timeout "$HEALTH_CONNECT_TIMEOUT" bash -c "exec 3<>/dev/tcp/$host/$port" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Hardware probes (BMC / sensors / software RAID)
# ---------------------------------------------------------------------------

hc_check_bmc() {
    if ! command -v ipmitool >/dev/null 2>&1; then
        hc_report BMC SKIP "ipmitool not installed"; return 0
    fi
    local cs
    cs=$(ipmitool chassis status 2>/dev/null) || {
        hc_report BMC SKIP "ipmitool has no access (run as root / ipmi driver)"; return 0; }
    local faults
    faults=$(printf '%s\n' "$cs" | grep -iE 'Fault[[:space:]]*:[[:space:]]*true' || true)
    if [[ -n "$faults" ]]; then
        hc_report BMC FAIL "chassis fault(s): $(printf '%s' "$faults" | tr '\n' ';')"
    else
        hc_report BMC PASS "chassis ok, no faults"
    fi
}

hc_check_sensors() {
    if ! command -v ipmitool >/dev/null 2>&1; then
        hc_report SENSORS SKIP "ipmitool not installed"; return 0
    fi
    local out
    out=$(ipmitool sdr list 2>/dev/null) || {
        hc_report SENSORS SKIP "ipmitool has no access"; return 0; }
    local cr nc
    cr=$(printf '%s\n' "$out" | awk -F'|' 'NF>=3{s=$NF; gsub(/[[:space:]]/,"",s); if(s=="cr") c++} END{print c+0}')
    nc=$(printf '%s\n' "$out" | awk -F'|' 'NF>=3{s=$NF; gsub(/[[:space:]]/,"",s); if(s=="nc") c++} END{print c+0}')
    if [[ "$cr" -gt 0 ]]; then
        hc_report SENSORS FAIL "$cr critical, $nc non-critical sensor(s)"
    elif [[ "$nc" -gt 0 ]]; then
        hc_report SENSORS WARN "$nc non-critical sensor(s)"
    else
        hc_report SENSORS PASS "all sensors nominal"
    fi
}

hc_check_raid() {
    if [[ ! -r /proc/mdstat ]]; then hc_report RAID SKIP "no /proc/mdstat"; return 0; fi
    local arrays
    arrays=$(grep -c '^md' /proc/mdstat 2>/dev/null || echo 0)
    if [[ "$arrays" -eq 0 ]]; then hc_report RAID SKIP "no md arrays"; return 0; fi
    if grep -qE '\[[U_]*_[U_]*\]' /proc/mdstat 2>/dev/null; then
        hc_report RAID FAIL "mdadm array degraded (see /proc/mdstat)"
    elif grep -qiE 'resync|recovery|rebuild|reshape' /proc/mdstat 2>/dev/null; then
        hc_report RAID WARN "mdadm resync/recovery in progress"
    else
        hc_report RAID PASS "$arrays md array(s) clean"
    fi
}

# ---------------------------------------------------------------------------
# Network probes (links / routes / egress / NFS mounts)
# ---------------------------------------------------------------------------

hc_check_links() {
    local nic name st carrier ign any=0 bad="" ignored=0
    shopt -s nullglob
    for nic in /sys/class/net/*; do
        name=$(basename "$nic")
        case "$name" in
            lo|docker*|veth*|br-*|virbr*|idrac|usb*) continue ;;
        esac
        # Explicit ignore list (unused ports an operator has silenced).
        for ign in $HEALTH_LINK_IGNORE; do
            if [[ "$name" == "$ign" ]]; then ignored=$((ignored+1)); continue 2; fi
        done
        [[ -r "$nic/operstate" ]] || continue
        any=1
        st=$(cat "$nic/operstate" 2>/dev/null || echo "?")
        if [[ "$st" == "up" ]]; then
            continue
        fi
        # Down: distinguish a configured-but-linkless NIC (real problem) from an
        # unused/admin-down port. `carrier` is only readable when admin-up, so an
        # unreadable carrier means the port was never brought up -> not a fault.
        carrier=$(cat "$nic/carrier" 2>/dev/null || true)
        if [[ -n "$carrier" ]]; then
            bad+="$name($st) "
        else
            ignored=$((ignored+1))
        fi
    done
    if [[ "$any" -eq 0 && "$ignored" -eq 0 ]]; then hc_report LINKS SKIP "no data NICs found"; return 0; fi
    if [[ -n "$bad" ]]; then
        hc_report LINKS WARN "configured NIC(s) down: ${bad% }"
    else
        local extra=""
        [[ "$ignored" -gt 0 ]] && extra=" ($ignored unused/admin-down ignored)"
        hc_report LINKS PASS "all active NICs up${extra}"
    fi
}

# NIC bonding / redundancy. With no bonds and HEALTH_EXPECT_BONDS unset this is a
# SKIP; set HEALTH_EXPECT_BONDS=1 on hosts where redundancy is required so the
# absence of bonds surfaces as a WARN. When bonds exist, each is checked: bond
# device down = FAIL, a down slave (degraded redundancy) = WARN, else PASS.
hc_check_bonds() {
    local b bonds=() bstate slaves s sdown fail="" warn="" ok=0 total=0
    shopt -s nullglob
    for b in /sys/class/net/*/bonding; do
        bonds+=("$(basename "$(dirname "$b")")")
    done
    if [[ ${#bonds[@]} -eq 0 ]]; then
        if [[ -n "$HEALTH_EXPECT_BONDS" ]]; then
            hc_report BONDS WARN "no bonds configured but expected (NIC redundancy absent)"
        else
            hc_report BONDS SKIP "no bonds configured (none expected)"
        fi
        return 0
    fi
    for b in "${bonds[@]}"; do
        total=$((total+1))
        bstate=$(cat "/sys/class/net/$b/operstate" 2>/dev/null || echo "?")
        slaves=$(cat "/sys/class/net/$b/bonding/slaves" 2>/dev/null || true)
        if [[ "$bstate" != "up" ]]; then
            fail+="$b(down) "
        elif [[ -z "$slaves" ]]; then
            warn+="$b(no-slaves) "
        else
            sdown=""
            for s in $slaves; do
                [[ "$(cat "/sys/class/net/$s/operstate" 2>/dev/null)" == "up" ]] || sdown+="$s "
            done
            if [[ -n "$sdown" ]]; then
                warn+="$b(degraded:${sdown% }) "
            else
                ok=$((ok+1))
            fi
        fi
    done
    if [[ -n "$fail" ]]; then
        hc_report BONDS FAIL "bond(s) down: ${fail% }"
    elif [[ -n "$warn" ]]; then
        hc_report BONDS WARN "${warn% }"
    else
        hc_report BONDS PASS "$ok/$total bond(s) healthy"
    fi
}

hc_check_routes() {
    if ! command -v ip >/dev/null 2>&1; then hc_report ROUTES SKIP "ip not available"; return 0; fi
    local n
    n=$(ip -4 route show default 2>/dev/null | grep -c . || echo 0)
    if [[ "$n" -ge 1 ]]; then
        hc_report ROUTES PASS "$n default route(s)"
    else
        hc_report ROUTES FAIL "no default route"
    fi
}

hc_check_egress() {
    local t host port bad="" ok=0 total=0
    for t in $HEALTH_EGRESS_TARGETS; do
        host="${t%:*}"; port="${t##*:}"; total=$((total+1))
        if hc_tcp "$host" "$port"; then ok=$((ok+1)); else bad+="$t "; fi
    done
    if [[ "$total" -eq 0 ]]; then hc_report EGRESS SKIP "no targets configured"; return 0; fi
    if [[ -z "$bad" ]]; then
        hc_report EGRESS PASS "$ok/$total integration endpoints reachable"
    else
        hc_report EGRESS WARN "unreachable: ${bad% } ($ok/$total ok)"
    fi
}

hc_check_mounts() {
    if ! command -v findmnt >/dev/null 2>&1 && ! command -v mountpoint >/dev/null 2>&1; then
        hc_report MOUNTS SKIP "findmnt/mountpoint unavailable"; return 0
    fi
    local m bad="" ok=0 total=0
    for m in $HEALTH_NFS_MOUNTS; do
        total=$((total+1))
        if mountpoint -q "$m" 2>/dev/null || findmnt -rn --target "$m" >/dev/null 2>&1; then
            # timeout-guarded read so a dead NFS mount can't hang the probe
            if timeout "$HEALTH_CONNECT_TIMEOUT" ls "$m" >/dev/null 2>&1; then
                ok=$((ok+1))
            else
                bad+="$m(stale) "
            fi
        else
            bad+="$m(not-mounted) "
        fi
    done
    if [[ "$total" -eq 0 ]]; then hc_report MOUNTS SKIP "none configured"; return 0; fi
    if [[ -z "$bad" ]]; then
        hc_report MOUNTS PASS "$ok/$total NFS mounts live"
    else
        hc_report MOUNTS FAIL "${bad% } ($ok/$total ok)"
    fi
}

# ---------------------------------------------------------------------------
# Host service probes (disk / nginx / db)
# ---------------------------------------------------------------------------

hc_check_disk() {
    if ! command -v df >/dev/null 2>&1; then hc_report DISK SKIP "df unavailable"; return 0; fi
    local fs use worst="PASS" msg=""
    for fs in $HEALTH_LOCAL_FS; do
        [[ -d "$fs" ]] || continue
        # Grab the field that ends in '%' (Use%/Capacity) rather than assuming a
        # fixed column, so df output variants can't yield a garbage number.
        use=$(df -P "$fs" 2>/dev/null | awk 'NR==2{for(i=1;i<=NF;i++) if($i ~ /%$/){gsub(/%/,"",$i); print $i; exit}}')
        [[ "$use" =~ ^[0-9]+$ ]] || continue
        [[ "$use" -gt 100 ]] && continue   # implausible -> df format mismatch, skip
        if [[ "$use" -ge "$HEALTH_DISK_FAIL_PCT" ]]; then
            msg+="$fs=${use}% "; worst="FAIL"
        elif [[ "$use" -ge "$HEALTH_DISK_WARN_PCT" ]]; then
            msg+="$fs=${use}% "; [[ "$worst" == "PASS" ]] && worst="WARN"
        fi
    done
    if [[ "$worst" == "PASS" ]]; then
        hc_report DISK PASS "all local FS < ${HEALTH_DISK_WARN_PCT}%"
    else
        hc_report DISK "$worst" "over threshold: ${msg% }"
    fi
}

hc_check_nginx() {
    if ! command -v systemctl >/dev/null 2>&1; then hc_report NGINX SKIP "systemctl unavailable"; return 0; fi
    if ! systemctl list-unit-files nginx.service >/dev/null 2>&1; then
        hc_report NGINX SKIP "nginx not a local service"; return 0
    fi
    local active
    active=$(systemctl is-active nginx 2>/dev/null || true)
    if [[ "$active" != "active" ]]; then hc_report NGINX FAIL "service $active"; return 0; fi
    local listen="" conf="config not tested"
    if nginx -t >/dev/null 2>&1; then conf="config ok"; fi
    if command -v ss >/dev/null 2>&1; then
        ss -tlnH 2>/dev/null | grep -qE ':443([^0-9]|$)' && listen+="443 "
        ss -tlnH 2>/dev/null | grep -qE ':8443([^0-9]|$)' && listen+="8443 "
    fi
    if [[ -z "$listen" ]]; then
        hc_report NGINX WARN "active; $conf; no 443/8443 listener seen"
    else
        hc_report NGINX PASS "active; $conf; listening: ${listen% }"
    fi
}

hc_check_db() {
    if ! command -v systemctl >/dev/null 2>&1; then hc_report DB SKIP "systemctl unavailable"; return 0; fi
    if ! systemctl list-unit-files mariadb.service >/dev/null 2>&1; then
        hc_report DB SKIP "mariadb not a local service (containerized?)"; return 0
    fi
    local active
    active=$(systemctl is-active mariadb 2>/dev/null || true)
    if [[ "$active" != "active" ]]; then hc_report DB FAIL "mariadb service $active"; return 0; fi
    local listening="no :3306"
    if command -v ss >/dev/null 2>&1; then
        ss -tlnH 2>/dev/null | grep -qE ':3306([^0-9]|$)' && listening="listening :3306"
    fi
    hc_report DB PASS "mariadb active; $listening"
}

# ---------------------------------------------------------------------------
# App-stack probes (env-scoped: containers / Solr / heartbeat)
# ---------------------------------------------------------------------------

# Map the normalized env to the deploy.yml container suffix.
__hc_env_suffix() {
    case "${1:-}" in
        prod) echo "prod" ;;
        staging|dev) echo "dev" ;;
        *) echo "" ;;
    esac
}

hc_check_containers() {
    local env="$1"
    if ! command -v docker >/dev/null 2>&1; then hc_report CONTAINERS SKIP "docker unavailable"; return 0; fi
    local suffix; suffix=$(__hc_env_suffix "$env")
    if [[ -z "$suffix" ]]; then hc_report CONTAINERS SKIP "no env given"; return 0; fi
    local running bad="" ok=0 total=0 svc
    running=$(docker ps --format '{{.Names}}' 2>/dev/null || true)
    for svc in "packrat-server-$suffix" "packrat-client-$suffix" "packrat-solr-$suffix"; do
        total=$((total+1))
        if printf '%s\n' "$running" | grep -qx "$svc"; then ok=$((ok+1)); else bad+="$svc "; fi
    done
    if [[ -z "$bad" ]]; then
        hc_report CONTAINERS PASS "$ok/$total up ($suffix)"
    else
        hc_report CONTAINERS FAIL "down: ${bad% } ($ok/$total up)"
    fi
}

hc_check_solr() {
    if ! command -v curl >/dev/null 2>&1; then hc_report SOLR SKIP "curl unavailable"; return 0; fi
    local out
    out=$(curl -s --max-time "$HEALTH_CONNECT_TIMEOUT" \
        "http://127.0.0.1:${HEALTH_SOLR_PORT}/solr/admin/cores?action=STATUS" 2>/dev/null || true)
    if [[ -z "$out" ]]; then hc_report SOLR FAIL "no response on :${HEALTH_SOLR_PORT}"; return 0; fi
    local p=0 m=0
    printf '%s' "$out" | grep -q '"packrat"' && p=1
    printf '%s' "$out" | grep -q '"packratMeta"' && m=1
    if [[ "$p" -eq 1 && "$m" -eq 1 ]]; then
        hc_report SOLR PASS "both cores present"
    elif [[ "$p" -eq 1 || "$m" -eq 1 ]]; then
        hc_report SOLR WARN "only one core present"
    else
        hc_report SOLR FAIL "cores not found in STATUS"
    fi
}

hc_check_heartbeat() {
    if ! command -v curl >/dev/null 2>&1; then hc_report HEARTBEAT SKIP "curl unavailable"; return 0; fi
    local port="$HEALTH_SERVER_PORT" out code body
    out=$(curl -s --max-time "$HEALTH_CONNECT_TIMEOUT" -w $'\n%{http_code}' \
        "http://127.0.0.1:${port}/heartbeat" 2>/dev/null || true)
    if [[ -z "$out" ]]; then hc_report HEARTBEAT FAIL "no response on :${port}"; return 0; fi
    code="${out##*$'\n'}"; body="${out%$'\n'*}"
    if [[ "$code" == "200" && "$body" == *Success* ]]; then
        hc_report HEARTBEAT PASS "healthy (:$port)"
    else
        hc_report HEARTBEAT FAIL "http ${code:-?}: ${body:0:60}"
    fi
}
