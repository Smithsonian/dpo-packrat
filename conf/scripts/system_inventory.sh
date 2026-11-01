#!/usr/bin/env bash
#
# system_inventory.sh - full host inventory for Packrat server comparison
#
# Self-contained, read-only snapshot of a host: hardware, OS, storage,
# network, services, database, web, containers, runtimes, monitoring and
# installed packages. Written to run on BOTH the legacy server and the new
# OCIO-provisioned server with no dependencies on the Packrat repo - copy
# this single file to each host, run it, then diff the two reports.
#
# Works on Debian/Ubuntu (dpkg/apt) and RHEL/Rocky/Alma (rpm/dnf). Every
# probe is guarded: a missing tool is reported, not fatal. No writes are
# made to the system; secrets in config files are redacted on output.
#
# Usage:
#   ./system_inventory.sh                 # interactive menu (preflight / report)
#   ./system_inventory.sh check           # preflight only: verify tools present
#   ./system_inventory.sh report          # run the full inventory report
#   ./system_inventory.sh report -o FILE  # report to a specific path
#   ./system_inventory.sh --stdout        # print to terminal only, no file
#   ./system_inventory.sh --no-packages   # skip the full package manifest
#   ./system_inventory.sh --help
#
# Running as root (or with passwordless sudo) fills in the root-only
# probes: dmidecode, SMART, RAID detail, listening-socket PIDs, firewall
# rules. Without it the script still runs and marks those sections as
# needing elevation.
#

# Deliberately NOT using `set -e`: every probe must run even if a prior
# one fails. `set -u` would trip on optional vars, so we stay lenient.
set -o pipefail 2>/dev/null || true

# ---------------------------------------------------------------------------
# Options
# ---------------------------------------------------------------------------

OUT=""
TO_STDOUT=0
WITH_PACKAGES=1
ACTION=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        check|preflight) ACTION="check";  shift ;;
        report|full)     ACTION="report"; shift ;;
        menu)            ACTION="menu";   shift ;;
        -o|--output)   OUT="${2:-}"; shift 2 ;;
        --stdout)      TO_STDOUT=1; shift ;;
        --no-packages) WITH_PACKAGES=0; shift ;;
        -h|--help)
            sed -n '2,28p' "$0"
            exit 0
            ;;
        *)
            echo "unknown argument: $1" >&2
            echo "see: $0 --help" >&2
            exit 2
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Elevation: use sudo only if it needs no password. Never prompt.
# ---------------------------------------------------------------------------

SUDO=""
if [[ "$(id -u)" -ne 0 ]]; then
    if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
        SUDO="sudo -n"
    fi
fi

# ---------------------------------------------------------------------------
# Distro family: both Packrat hosts are RHEL, so this is a sanity assertion
# surfaced in the report header - anything other than "rhel" is itself a
# finding. rpm/dpkg presence is the reliable signal; os-release is fallback.
# ---------------------------------------------------------------------------

DISTRO_FAMILY="unknown"
if command -v rpm >/dev/null 2>&1 && ! command -v dpkg >/dev/null 2>&1; then
    DISTRO_FAMILY="rhel"
elif command -v dpkg >/dev/null 2>&1; then
    DISTRO_FAMILY="debian"
elif [[ -r /etc/os-release ]]; then
    like="$(grep -E '^(ID|ID_LIKE)=' /etc/os-release 2>/dev/null | tr 'A-Z' 'a-z')"
    case "$like" in
        *rhel*|*fedora*|*centos*|*rocky*|*alma*) DISTRO_FAMILY="rhel" ;;
        *debian*|*ubuntu*)                       DISTRO_FAMILY="debian" ;;
    esac
fi

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

section() { printf '\n\n============================================================\n== %s\n============================================================\n' "$1"; }
h()       { printf '\n----- %s -----\n' "$1"; }
note()    { printf '  %s\n' "$1"; }
skip()    { printf '  (skipped: %s)\n' "$1"; }
have()    { command -v "$1" >/dev/null 2>&1; }

# Is elevation available for root-only probes?
elevated() { [[ "$(id -u)" -eq 0 || -n "$SUDO" ]]; }

# Run a command only if the first word is installed; otherwise mark it.
# Usage: guard <cmd> [args...]
guard() {
    local bin="$1"
    if have "$bin"; then
        "$@" 2>&1 || printf '  (exit %s)\n' "$?"
    else
        skip "$bin not installed"
    fi
}

# Mask secret values in any config/file content streamed through here.
redact() {
    sed -E 's/((pass(word)?|secret|token|api[-_]?key|access[-_]?key|private[-_]?key|aws[-_]?secret[a-z_]*|client[-_]?secret)[[:space:]]*[:=][[:space:]]*)["'"'"']?[^"'"'"'[:space:]]+/\1[REDACTED]/Ig'
}

# Print a file (readable check, size cap, redacted). Usage: showfile PATH
showfile() {
    local f="$1"
    if [[ ! -e "$f" ]]; then
        note "(absent: $f)"
        return
    fi
    if [[ ! -r "$f" ]]; then
        if elevated; then
            printf '# %s\n' "$f"
            $SUDO cat -- "$f" 2>/dev/null | redact
        else
            note "(unreadable without root: $f)"
        fi
        return
    fi
    printf '# %s\n' "$f"
    redact < "$f"
}

# ---------------------------------------------------------------------------
# The report body - everything prints to stdout; caller tees to a file.
# ---------------------------------------------------------------------------

generate_report() {

printf 'PACKRAT HOST INVENTORY\n'
printf 'report-format: 2\n'
printf 'host: %s\n' "$(hostname -f 2>/dev/null || hostname 2>/dev/null || echo unknown)"
printf 'distro-family: %s\n' "$DISTRO_FAMILY"
printf 'generated: %s\n' "$(date '+%F %T %Z' 2>/dev/null)"
printf 'run-as: uid=%s%s\n' "$(id -un 2>/dev/null)" "$(elevated && echo ' (elevated)' || echo ' (unprivileged - some probes limited)')"

# =========================================================================
section "1. OS / IDENTITY"
# =========================================================================
h "os-release";      showfile /etc/os-release
h "kernel";          guard uname -a
h "hostnamectl";     guard hostnamectl
h "virtualization";  guard systemd-detect-virt
h "uptime / load";   guard uptime
h "time / clock";    guard timedatectl
h "locale";          guard localectl status; have locale && { echo; locale; }

# =========================================================================
section "2. CPU / PROCESSORS"
# =========================================================================
h "lscpu";           guard lscpu
h "logical cpus (/proc/cpuinfo count)"
if [[ -r /proc/cpuinfo ]]; then
    note "processors: $(grep -c '^processor' /proc/cpuinfo)"
    note "model: $(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2- | sed 's/^ //')"
fi
h "physical cpu / dimm (dmidecode)"
if elevated && have dmidecode; then
    $SUDO dmidecode -t processor 2>/dev/null | grep -E 'Socket Designation|Version|Core Count|Thread Count|Max Speed' | sed 's/^/  /'
else
    skip "dmidecode needs root"
fi

# =========================================================================
section "3. MEMORY"
# =========================================================================
h "free -h";         guard free -h
h "meminfo totals"
if [[ -r /proc/meminfo ]]; then
    grep -E '^(MemTotal|MemFree|MemAvailable|SwapTotal|SwapFree|Hugepagesize|HugePages_Total):' /proc/meminfo | sed 's/^/  /'
fi
h "swap devices";    guard swapon --show
h "physical dimms (dmidecode)"
if elevated && have dmidecode; then
    $SUDO dmidecode -t memory 2>/dev/null | grep -E 'Size:|Type:|Speed:|Locator:|Manufacturer:' | grep -v 'No Module' | sed 's/^/  /'
else
    skip "dmidecode needs root"
fi

# =========================================================================
section "4. STORAGE / DISK"
# =========================================================================
h "block devices (lsblk)";  guard lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL,ROTA,SERIAL
h "disk usage (df -hT)";    guard df -hT -x tmpfs -x devtmpfs
h "inode usage (df -i)";    guard df -i -x tmpfs -x devtmpfs
h "partition tables"
if elevated && have fdisk; then $SUDO fdisk -l 2>/dev/null | grep -E 'Disk /|^/dev/' | sed 's/^/  /'; else skip "fdisk needs root"; fi
h "software RAID (/proc/mdstat)";  showfile /proc/mdstat
h "mdadm detail"
if elevated && have mdadm; then
    for md in /dev/md*; do [[ -b "$md" ]] && { echo "## $md"; $SUDO mdadm --detail "$md" 2>/dev/null | sed 's/^/  /'; }; done
else
    skip "mdadm needs root / not present"
fi
h "LVM"
guard pvs; guard vgs; guard lvs
h "SMART health (summary)"
if elevated && have smartctl; then
    for d in /dev/sd? /dev/nvme?n?; do
        [[ -b "$d" ]] || continue
        echo "## $d"
        $SUDO smartctl -H "$d" 2>/dev/null | grep -Ei 'result|health' | sed 's/^/  /'
    done
else
    skip "smartctl needs root / not installed"
fi

# =========================================================================
section "5. MOUNTS / FILESYSTEMS"
# =========================================================================
h "active mounts (non-virtual)"
if have findmnt; then
    findmnt -rno TARGET,SOURCE,FSTYPE,OPTIONS 2>/dev/null \
        | grep -vE '^(/sys|/proc|/dev|/run)' | sort | sed 's/^/  /'
else
    guard mount
fi
h "/etc/fstab";        showfile /etc/fstab
h "NFS / network mounts (current)"
guard mount | grep -Ei 'type (nfs|nfs4|cifs|fuse)' | sed 's/^/  /' || note "(none)"
h "autofs maps"
showfile /etc/auto.master
for m in /etc/auto.*; do [[ "$m" == /etc/auto.master ]] && continue; [[ -f "$m" ]] && showfile "$m"; done

# =========================================================================
section "6. NETWORK"
# =========================================================================
h "interfaces (ip addr)";   guard ip -brief addr
h "interfaces (detail)";    guard ip addr
h "routes";                 guard ip route
h "link speed / NICs"
for i in /sys/class/net/*; do
    ifn="$(basename "$i")"
    [[ "$ifn" == lo ]] && continue
    spd="$(cat "$i/speed" 2>/dev/null || echo '?')"
    mac="$(cat "$i/address" 2>/dev/null || echo '?')"
    note "$ifn  speed=${spd}Mb/s  mac=$mac"
done
h "DNS (resolv.conf)";      showfile /etc/resolv.conf
h "hosts file";             showfile /etc/hosts
h "hostname -I";            guard hostname -I

# =========================================================================
section "7. FIREWALL / PORTS"
# =========================================================================
h "listening sockets (ss -tulpn)"
if have ss; then
    $SUDO ss -tulpn 2>/dev/null | sort | sed 's/^/  /'
else
    guard netstat -tulpn
fi
h "firewalld"
guard firewall-cmd --state; have firewall-cmd && $SUDO firewall-cmd --list-all 2>/dev/null | sed 's/^/  /'
h "iptables"
if elevated && have iptables; then $SUDO iptables -S 2>/dev/null | sed 's/^/  /'; else skip "iptables needs root / absent"; fi
h "nftables"
if elevated && have nft; then $SUDO nft list ruleset 2>/dev/null | head -100 | sed 's/^/  /'; else skip "nft needs root / absent"; fi

# =========================================================================
section "8. ACCOUNTS / USERS / GROUPS"
# =========================================================================
h "human + service accounts (uid 0, 1000-60000)"
if have getent; then
    getent passwd | awk -F: '$3==0 || ($3>=1000 && $3<60000){printf "  %-20s uid=%-6s gid=%-6s shell=%s home=%s\n",$1,$3,$4,$7,$6}' | sort
fi
h "groups (sudo / wheel / docker / packrat)"
if have getent; then
    for g in sudo wheel admin docker mysql packrat nginx www-data; do
        line="$(getent group "$g" 2>/dev/null)" && note "$line"
    done
fi
h "sudoers drop-ins (names only)"
if elevated; then
    $SUDO ls -l /etc/sudoers.d 2>/dev/null | sed 's/^/  /'
else
    ls -l /etc/sudoers.d 2>/dev/null | sed 's/^/  /' || skip "needs root"
fi
h "sshd config (key directives)"
if [[ -r /etc/ssh/sshd_config ]] || elevated; then
    ( $SUDO grep -Ei '^[[:space:]]*(Port|PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|ChallengeResponseAuthentication|AllowUsers|AllowGroups|X11Forwarding|UsePAM)' /etc/ssh/sshd_config 2>/dev/null; \
      $SUDO grep -rhEi '^[[:space:]]*(Port|PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|AllowUsers|AllowGroups)' /etc/ssh/sshd_config.d 2>/dev/null ) | sed 's/^/  /'
else
    skip "sshd_config needs root"
fi
h "authorized_keys presence (counts, not contents)"
if have getent; then
    while IFS=: read -r user _ uid _ _ home _; do
        [[ "$uid" -eq 0 || ( "$uid" -ge 1000 && "$uid" -lt 60000 ) ]] || continue
        ak="$home/.ssh/authorized_keys"
        if $SUDO test -f "$ak" 2>/dev/null; then
            cnt="$($SUDO grep -c '^ssh-\|^ecdsa\|^sk-' "$ak" 2>/dev/null || echo '?')"
            note "$user: $cnt key(s)"
        fi
    done < <(getent passwd)
fi

# =========================================================================
section "9. PERMISSIONS (Packrat paths)"
# =========================================================================
h "ownership / mode of key paths"
PACKRAT_PATHS=(
    /data /data/Packrat /data/Packrat/Backups
    /staging /3ddigip01
    /opt/Packrat /var/www
    /var/lib/mysql /var/lib/solr
    /etc/nginx /etc/my.cnf.d /etc/mysql
)
for p in "${PACKRAT_PATHS[@]}"; do
    if [[ -e "$p" ]]; then
        $SUDO stat -c '  %A %U:%G  %n' "$p" 2>/dev/null || ls -ld "$p" 2>/dev/null | sed 's/^/  /'
    else
        note "(absent: $p)"
    fi
done

# =========================================================================
section "10. SYSTEMD SERVICES"
# =========================================================================
h "enabled unit files"
guard systemctl list-unit-files --state=enabled --no-pager --no-legend | sort | sed 's/^/  /'
h "running services"
guard systemctl list-units --type=service --state=running --no-pager --no-legend | sort | sed 's/^/  /'
h "failed units"
guard systemctl --failed --no-pager --no-legend | sed 's/^/  /'

# =========================================================================
section "11. CRON / SCHEDULED TASKS"
# =========================================================================
h "per-user crontabs"
if have getent && have crontab; then
    while IFS=: read -r user _ uid _ _ _ _; do
        [[ "$uid" -eq 0 || ( "$uid" -ge 1000 && "$uid" -lt 60000 ) ]] || continue
        ct="$($SUDO crontab -l -u "$user" 2>/dev/null)"
        [[ -n "$ct" ]] && { echo "## $user"; echo "$ct" | redact | sed 's/^/  /'; }
    done < <(getent passwd)
else
    skip "crontab/getent unavailable"
fi
h "/etc/crontab";          showfile /etc/crontab
h "/etc/cron.d";           for f in /etc/cron.d/*; do [[ -f "$f" ]] && showfile "$f"; done
h "cron.{hourly,daily,weekly,monthly} (names)"
for d in hourly daily weekly monthly; do
    echo "## cron.$d"; ls -1 "/etc/cron.$d" 2>/dev/null | sed 's/^/  /'
done
h "systemd timers"
guard systemctl list-timers --all --no-pager --no-legend | sed 's/^/  /'

# =========================================================================
section "12. DATABASE (MariaDB / MySQL)"
# =========================================================================
h "client / server version"
guard mariadb --version
have mysql && mysql --version 2>/dev/null | sed 's/^/  /'
h "service status"
for svc in mariadb mysql mysqld; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^$svc"; then
        note "$svc: active=$(systemctl is-active "$svc" 2>/dev/null) enabled=$(systemctl is-enabled "$svc" 2>/dev/null)"
    fi
done
h "config files (redacted)"
showfile /etc/my.cnf
for f in /etc/my.cnf.d/*.cnf /etc/mysql/my.cnf /etc/mysql/mariadb.conf.d/*.cnf /etc/mysql/conf.d/*.cnf; do
    [[ -f "$f" ]] && showfile "$f"
done
h "server variables (best-effort connect)"
# Tries socket / ~/.my.cnf auth only. Never embeds a password here.
if have mysql; then
    mysql -N -e "SHOW VARIABLES WHERE Variable_name IN ('version','version_compile_os','datadir','port','socket','max_connections','innodb_buffer_pool_size','character_set_server','collation_server','sql_mode');" 2>/dev/null | sed 's/^/  /' \
        || note "(could not connect without credentials - run as a user with socket auth)"
    h "databases"
    mysql -N -e "SHOW DATABASES;" 2>/dev/null | sed 's/^/  /' || note "(no access)"
else
    skip "mysql client not installed"
fi

# =========================================================================
section "13. WEB / NGINX"
# =========================================================================
h "version / build modules";  guard nginx -v; have nginx && $SUDO nginx -V 2>&1 | tr ' ' '\n' | grep -E 'with|module' | sed 's/^/  /'
h "config test";              have nginx && $SUDO nginx -t 2>&1 | sed 's/^/  /' || skip "nginx absent"
h "effective config (nginx -T, redacted)"
if have nginx; then
    $SUDO nginx -T 2>/dev/null | redact | sed 's/^/  /'
else
    skip "nginx absent"
fi
h "apache/httpd (if present)"
guard httpd -v; guard apache2 -v

# =========================================================================
section "14. DOCKER / CONTAINERS"
# =========================================================================
h "docker version";  guard docker --version; guard docker compose version; guard docker-compose --version
h "docker info (summary)"
if have docker; then
    $SUDO docker info 2>/dev/null | grep -Ei 'Server Version|Storage Driver|Cgroup|Logging Driver|Docker Root Dir|Operating System|Total Memory|CPUs|Live Restore' | sed 's/^/  /' \
        || note "(docker daemon not reachable for this user)"
    h "containers";  $SUDO docker ps -a --format '  {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null
    h "images";      $SUDO docker images --format '  {{.Repository}}:{{.Tag}}\t{{.Size}}' 2>/dev/null | sort
else
    skip "docker not installed"
fi
h "podman (if present)";  guard podman --version

# =========================================================================
section "15. RUNTIMES / DEV TOOLS"
# =========================================================================
h "versions of interest"
for tool in node npm npx yarn pnpm python3 python java openssl git make gcc g++ cmake curl wget jq rsync nano vim tmux screen unzip zip; do
    if have "$tool"; then
        ver="$("$tool" --version 2>&1 | head -1)"
        printf '  %-10s %s\n' "$tool" "$ver"
    else
        printf '  %-10s (not installed)\n' "$tool"
    fi
done
h "node version managers / global npm"
guard nvm --version
have npm && { echo "## global npm packages"; npm ls -g --depth=0 2>/dev/null | sed 's/^/  /'; }

# =========================================================================
section "16. SEARCH (Solr)"
# =========================================================================
h "solr service / binary"
for svc in solr; do
    systemctl list-unit-files 2>/dev/null | grep -q "^$svc" && \
        note "$svc: active=$(systemctl is-active "$svc" 2>/dev/null) enabled=$(systemctl is-enabled "$svc" 2>/dev/null)"
done
guard solr version
h "solr port 8983 / cores (best-effort HTTP)"
if have curl; then
    curl -s --max-time 5 'http://localhost:8983/solr/admin/info/system?wt=json' 2>/dev/null | head -c 600 | sed 's/^/  /'
    echo
    curl -s --max-time 5 'http://localhost:8983/solr/admin/cores?action=STATUS&wt=json' 2>/dev/null \
        | tr ',' '\n' | grep -Ei '"name"|numDocs|instanceDir' | sed 's/^/  /'
else
    skip "curl not installed"
fi

# =========================================================================
section "17. MONITORING / OBSERVABILITY / LOGGING"
# =========================================================================
h "agents / exporters (installed?)"
for mon in node_exporter prometheus grafana-server netdata collectd telegraf \
           zabbix_agentd zabbix_agent2 zabbix-agent zabbix-agent2 datadog-agent \
           filebeat metricbeat otelcol otelcol-contrib vector fluent-bit td-agent \
           openobserve auditd rsyslogd nrpe snmpd \
           sentinelone sentineld sentinelagent splunkd SplunkForwarder splunk \
           qualys-cloud-agent quosvc qagent ir_agent nexpose \
           netbackup nbclient vnetd racadm ipmitool; do
    if have "$mon" || systemctl list-unit-files 2>/dev/null | grep -qi "^${mon}\.service"; then
        st="$(systemctl is-active "$mon" 2>/dev/null || echo n/a)"
        printf '  %-18s present (service=%s)\n' "$mon" "$st"
    fi
done
note "(only present agents are listed above; absence = not installed)"
h "vendor agent / tool directories (off-PATH installs)"
for d in /opt/sentinelone /opt/splunkforwarder /opt/cohesity /opt/veritas \
         /opt/VRTSpbx /usr/openv /opt/puppetlabs /opt/rapid7 \
         /opt/MegaRAID /opt/lsi /opt/dell /etc/insights-client; do
    [[ -e "$d" ]] && note "present: $d"
done
h "journald persistence"
guard grep -E '^[^#]*Storage' /etc/systemd/journald.conf
note "journal disk usage:"; guard journalctl --disk-usage
h "rsyslog config present";  [[ -f /etc/rsyslog.conf ]] && note "yes: /etc/rsyslog.conf" || note "no"
h "logrotate";              guard ls /etc/logrotate.d

# =========================================================================
section "18. SECURITY POSTURE"
# =========================================================================
h "SELinux"
guard getenforce; guard sestatus
h "fail2ban"
have fail2ban-client && $SUDO fail2ban-client status 2>/dev/null | sed 's/^/  /' || skip "fail2ban not present"
h "unattended/automatic updates"
[[ -f /etc/apt/apt.conf.d/20auto-upgrades ]] && showfile /etc/apt/apt.conf.d/20auto-upgrades
systemctl list-unit-files 2>/dev/null | grep -Ei 'dnf-automatic|unattended' | sed 's/^/  /'

# =========================================================================
section "19. KERNEL TUNING / LIMITS"
# =========================================================================
h "ulimit -a (current shell)";  guard bash -c 'ulimit -a'
h "sysctl (selected)"
for key in fs.file-max vm.swappiness vm.overcommit_memory vm.max_map_count \
           net.core.somaxconn net.ipv4.tcp_max_syn_backlog net.ipv4.ip_local_port_range \
           kernel.pid_max; do
    val="$(sysctl -n "$key" 2>/dev/null)" && printf '  %-34s = %s\n' "$key" "$val"
done
h "limits.conf + drop-ins"
showfile /etc/security/limits.conf
for f in /etc/security/limits.d/*.conf; do [[ -f "$f" ]] && showfile "$f"; done

# =========================================================================
section "20. SHELL ALIASES / FUNCTIONS / PROFILE CUSTOMIZATION"
# =========================================================================
h "system-wide shell init (alias / export / PATH lines)"
for f in /etc/profile /etc/bash.bashrc /etc/bashrc /etc/environment /etc/zsh/zshrc; do
    if [[ -f "$f" ]]; then
        echo "## $f"
        grep -nE '^[[:space:]]*(alias |export |PATH=)' "$f" 2>/dev/null | redact | sed 's/^/  /'
    fi
done
for f in /etc/profile.d/*.sh /etc/profile.d/*.csh; do
    if [[ -f "$f" ]]; then
        lines="$(grep -nE '^[[:space:]]*(alias |export |setenv )' "$f" 2>/dev/null | redact)"
        [[ -n "$lines" ]] && { echo "## $f"; echo "$lines" | sed 's/^/  /'; }
    fi
done
h "per-user aliases / functions (from shell rc files)"
if have getent; then
    while IFS=: read -r user _ uid _ _ home _; do
        [[ "$uid" -eq 0 || ( "$uid" -ge 1000 && "$uid" -lt 60000 ) ]] || continue
        for rc in .bashrc .bash_aliases .bash_profile .profile .zshrc .zsh_aliases; do
            f="$home/$rc"
            if $SUDO test -f "$f" 2>/dev/null; then
                out="$($SUDO grep -nE '^[[:space:]]*(alias |function [A-Za-z_]|[A-Za-z_][A-Za-z0-9_]*\(\))' "$f" 2>/dev/null | redact)"
                [[ -n "$out" ]] && { echo "## $user : $rc"; echo "$out" | sed 's/^/  /'; }
            fi
        done
    done < <(getent passwd)
fi
h "aliases active in this shell"
alias 2>/dev/null | redact | sed 's/^/  /' || note "(none in this non-interactive shell)"

# =========================================================================
section "21. INSTALLED PACKAGES (full manifest)"
# =========================================================================
if [[ "$WITH_PACKAGES" -eq 1 ]]; then
    if have dpkg; then
        h "dpkg -l (name version)"
        dpkg-query -W -f='  ${Package} ${Version}\n' 2>/dev/null | sort
    elif have rpm; then
        h "rpm -qa"
        rpm -qa --qf '  %{NAME} %{VERSION}-%{RELEASE}\n' 2>/dev/null | sort
    else
        skip "no dpkg or rpm found"
    fi
    h "package manager repos"
    [[ -d /etc/apt/sources.list.d ]] && { showfile /etc/apt/sources.list; for f in /etc/apt/sources.list.d/*; do [[ -f "$f" ]] && showfile "$f"; done; }
    [[ -d /etc/yum.repos.d ]] && for f in /etc/yum.repos.d/*.repo; do [[ -f "$f" ]] && showfile "$f"; done
else
    note "(package manifest skipped via --no-packages)"
fi

printf '\n\n=== END OF REPORT ===\n'

}

# ---------------------------------------------------------------------------
# Preflight: verify the tools the report depends on are installed.
# ---------------------------------------------------------------------------

PF_PRESENT=0
PF_MISSING=0

check_group() {
    local title="$1"; shift
    printf '\n%s\n' "$title"
    local t
    for t in "$@"; do
        if have "$t"; then
            printf '  [ OK ] %-16s %s\n' "$t" "$(command -v "$t" 2>/dev/null)"
            PF_PRESENT=$((PF_PRESENT + 1))
        else
            printf '  [ -- ] %-16s (not found)\n' "$t"
            PF_MISSING=$((PF_MISSING + 1))
        fi
    done
}

# Monitoring / management agents are usually services or vendor binaries that
# live off $PATH, so a plain command check misses them. check_agent detects by
# command name, absolute path, OR systemd unit (unit list cached once below).
PF_UNITS=""

check_agent() {
    local label="$1"; shift
    local found="" c
    for c in "$@"; do
        if [[ "$c" == /* ]]; then
            if [[ -e "$c" ]] || { elevated && $SUDO test -e "$c" 2>/dev/null; }; then
                found="path:$c"; break
            fi
        elif have "$c"; then
            found="cmd:$(command -v "$c" 2>/dev/null)"; break
        elif printf '%s' "$PF_UNITS" | grep -qiE "(^|[[:space:]])${c}\.service([[:space:]]|\$)"; then
            found="unit:${c}.service"; break
        fi
    done
    if [[ -n "$found" ]]; then
        printf '  [ OK ] %-20s present (%s)\n' "$label" "$found"
        PF_PRESENT=$((PF_PRESENT + 1))
    else
        printf '  [ -- ] %-20s (not detected)\n' "$label"
        PF_MISSING=$((PF_MISSING + 1))
    fi
}

preflight() {
    PF_PRESENT=0
    PF_MISSING=0
    printf '============================================================\n'
    printf 'PACKRAT INVENTORY - PREFLIGHT TOOL CHECK\n'
    printf 'host: %s   run-as: uid=%s%s\n' \
        "$(hostname 2>/dev/null || echo unknown)" \
        "$(id -un 2>/dev/null)" \
        "$(elevated && echo ' (elevated)' || echo ' (unprivileged)')"
    printf '============================================================\n'

    check_group "CORE (base inventory - expected on every host)" \
        uname hostname date df lsblk findmnt ip ss getent systemctl stat sysctl free awk sed grep
    check_group "HARDWARE DETAIL (root-only output)" \
        lscpu dmidecode smartctl mdadm fdisk
    check_group "STORAGE (LVM)" \
        pvs vgs lvs
    check_group "NETWORK / FIREWALL" \
        ethtool firewall-cmd iptables nft
    check_group "SECURITY" \
        getenforce sestatus fail2ban-client
    check_group "DATABASE" \
        mariadb mysql
    check_group "WEB / CONTAINERS" \
        nginx docker podman
    check_group "RUNTIMES" \
        node npm yarn java python3 git
    check_group "SEARCH / UTIL" \
        solr curl jq rsync nano

    # Cache the full unit list once so per-agent unit lookups are cheap.
    PF_UNITS="$(systemctl list-unit-files --no-legend 2>/dev/null; systemctl list-units --all --type=service --no-legend 2>/dev/null)"
    printf '\nMONITORING / MANAGEMENT AGENTS (expected from OCIO handoff)\n'
    # Security / EDR
    check_agent "SentinelOne"   sentinelctl sentineld sentinelone sentinelagent linux_agent /opt/sentinelone
    check_agent "Qualys"        quosvc qualys-cloud-agent qagent /usr/local/qualys/cloud-agent/bin/qualys-cloud-agent
    check_agent "Nexpose/Rapid7" ir_agent nexpose /opt/rapid7/ir_agent/ir_agent
    note "Qualys/Nexpose at SI are typically AGENTLESS (central scans) - absence here is expected."
    # Logging / metrics
    check_agent "Splunk fwd"    splunkd SplunkForwarder splunk /opt/splunkforwarder
    check_agent "Zabbix"        zabbix_agent2 zabbix_agentd zabbix-agent2 zabbix-agent
    check_agent "NRPE / Nagios" nrpe nagios
    check_agent "SNMP"          snmpd
    check_agent "auditd"        auditctl auditd
    check_agent "rsyslog"       rsyslogd rsyslog
    # Backup
    check_agent "NetBackup"     /usr/openv/netbackup/bin/bpcd netbackup nbclient vnetd /opt/VRTSpbx /opt/veritas
    check_agent "Cohesity"      /opt/cohesity cohesity-agent cohesityagent
    # Config management / platform
    check_agent "Puppet"        /opt/puppetlabs/puppet/bin/puppet puppet /opt/puppetlabs
    check_agent "Red Hat Insights" insights-client /etc/insights-client
    # Hardware / RAID tooling
    check_agent "Dell/MegaRAID" storcli perccli omreport /opt/MegaRAID /opt/lsi /opt/dell
    check_agent "iDRAC tools"   racadm ipmitool
    note "iDRAC is an out-of-band BMC; the line above only checks host-side CLI tools (racadm/ipmitool)."

    printf '\nPACKAGE MANAGER\n'
    if have dpkg; then
        printf '  [ OK ] %-16s %s\n' "dpkg" "$(command -v dpkg)"
    elif have rpm; then
        printf '  [ OK ] %-16s %s\n' "rpm" "$(command -v rpm)"
    else
        printf '  [ -- ] %-16s (no dpkg or rpm - package manifest unavailable)\n' "dpkg/rpm"
    fi

    printf '\n------------------------------------------------------------\n'
    printf 'Summary: %d present, %d missing.\n' "$PF_PRESENT" "$PF_MISSING"
    printf 'Missing TOOLS are not fatal - the report simply skips their\n'
    printf 'probes. Root-only tools (dmidecode, smartctl, mdadm, nft,\n'
    printf 'iptables) also need sudo to produce output.\n'
    printf 'A missing AGENT, however, may be a real OCIO-handoff gap\n'
    printf 'worth raising (e.g. no SentinelOne / Zabbix / NetBackup).\n'
    if ! elevated; then
        printf 'NOTE: not running elevated - re-run with sudo for full detail.\n'
    fi
    printf '------------------------------------------------------------\n'
}

# ---------------------------------------------------------------------------
# Report runners
# ---------------------------------------------------------------------------

is_tty() { [[ -t 0 && -t 1 ]]; }

default_out_name() {
    local host_short
    host_short="$(hostname -s 2>/dev/null || hostname 2>/dev/null || echo host)"
    printf '%s_inventory_%s.txt' "$host_short" "$(date '+%Y%m%d_%H%M%S')"
}

# Write report to $OUT (auto-named if empty) or stdout if --stdout.
run_report() {
    if [[ "$TO_STDOUT" -eq 1 ]]; then
        generate_report
        return
    fi
    local dest="$OUT"
    [[ -z "$dest" ]] && dest="$(default_out_name)"
    generate_report | tee "$dest"
    printf '\nReport written to: %s\n' "$dest" >&2
}

# Interactive report: prompt for a save location (menu path).
run_report_prompt() {
    local def dest
    def="$(default_out_name)"
    printf '\nWhere should the report be saved?\n'
    printf "  (press Enter for default, or '-' for screen only)\n"
    read -r -p "Path [$def]: " dest
    dest="${dest:-$def}"
    if [[ "$dest" == "-" ]]; then
        generate_report
    else
        generate_report | tee "$dest"
        printf '\nReport written to: %s\n' "$dest" >&2
    fi
}

# ---------------------------------------------------------------------------
# Interactive menu
# ---------------------------------------------------------------------------

main_menu() {
    local c
    while :; do
        printf '\n============================================================\n'
        printf '  PACKRAT HOST INVENTORY\n'
        printf '============================================================\n'
        printf '  [1] Preflight  - verify required tools are installed\n'
        printf '  [2] Report     - run the full inventory report\n'
        printf '  [3] Both       - preflight, then report\n'
        printf '  [Q] Quit\n'
        printf '------------------------------------------------------------\n'
        read -r -p "Choose: " c
        case "$c" in
            1) preflight ;;
            2) run_report_prompt ;;
            3) preflight; run_report_prompt ;;
            [Qq]) break ;;
            *) echo "invalid choice: $c" ;;
        esac
    done
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

# An explicit flag (-o / --stdout) implies a direct report run, not the menu.
if [[ -z "$ACTION" && ( -n "$OUT" || "$TO_STDOUT" -eq 1 ) ]]; then
    ACTION="report"
fi

# No action and an interactive terminal -> show the menu.
if [[ -z "$ACTION" ]]; then
    if is_tty; then
        ACTION="menu"
    else
        ACTION="report"
    fi
fi

case "$ACTION" in
    check)  preflight ;;
    menu)   main_menu ;;
    report)
        # A bare `report` on a TTY still prompts for the path; with -o or
        # --stdout, or when non-interactive, it runs straight through.
        if is_tty && [[ -z "$OUT" && "$TO_STDOUT" -eq 0 ]]; then
            run_report_prompt
        else
            run_report
        fi
        ;;
esac
