#!/usr/bin/env bash
# Install and enroll the Zabbix Agent 2 on a Packrat host (RHEL + SELinux).
#
# Installs the official Zabbix repo + zabbix-agent2, applies a custom SELinux
# policy module so the "Linux by Zabbix agent" template's privileged items work
# under SELinux enforcing, points the agent at the SI monitoring server, and
# enables the service. Safe to re-run.
#
# Synced from the repo (source of truth):
#   conf/zabbix/selinux/packrat-zabbix.te   -> compiled + loaded SELinux module
#   conf/zabbix/selinux/packrat-zabbix.fc   -> file context for the agent binary
#
# Assumes (configured at box build, outside this script):
#   conf/nginx/conf.d/zabbix.conf           loopback stub_status for nginx items
#   firewalld tcp/10050 from the Zabbix server (rich rule)
#   the server-side host record on the Zabbix server (created by OCIO)
#
# Overridable via environment:
#   ZABBIX_VERSION   Zabbix release train                  (default 6.0)
#   ZABBIX_SERVER    Zabbix server IP/host                 (default 160.111.103.43)
#   ZABBIX_HOSTNAME  agent Hostname; MUST match the host
#                    registered server-side                (default: hostname -f)
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SELINUX_SRC="${SCRIPT_DIR}/selinux"
readonly SELINUX_MODULE='packrat-zabbix'
readonly AGENT_CONF='/etc/zabbix/zabbix_agent2.conf'

ZABBIX_VERSION="${ZABBIX_VERSION:-6.0}"
ZABBIX_SERVER="${ZABBIX_SERVER:-160.111.103.43}"
ZABBIX_HOSTNAME="${ZABBIX_HOSTNAME:-$(hostname -f)}"
readonly ZABBIX_VERSION ZABBIX_SERVER ZABBIX_HOSTNAME

if [[ ${EUID} -ne 0 ]]; then
    echo 'Must be run as root' >&2
    exit 1
fi

umask 0022

# RHEL major version drives the Zabbix repo URL (el8/el9/...).
RHEL_VERSION="$(sed -En '/^VERSION_ID/s/^.*="([0-9]+).*$/\1/p' /etc/os-release)"
readonly RHEL_VERSION
if [[ -z "${RHEL_VERSION}" ]]; then
    echo 'Could not determine RHEL major version from /etc/os-release' >&2
    exit 1
fi

# EPEL ships its own zabbix* packages that collide with the Zabbix repo and can
# pull the wrong agent version. Exclude them from EPEL before installing.
readonly EPEL_REPO='/etc/yum.repos.d/epel.repo'
if [[ -f "${EPEL_REPO}" ]] && ! grep -q '^excludepkgs=zabbix\*$' "${EPEL_REPO}"; then
    sed -i '/^\[epel\]$/a excludepkgs=zabbix*' "${EPEL_REPO}"
fi

dnf install -y "https://repo.zabbix.com/zabbix/${ZABBIX_VERSION}/rhel/${RHEL_VERSION}/x86_64/zabbix-release-latest-${ZABBIX_VERSION}.el${RHEL_VERSION}.noarch.rpm"
dnf install -y zabbix-agent2 checkpolicy policycoreutils

# Build + load the SELinux policy module so the agent's privileged template items
# (software inventory via rpm, block-device discovery) are allowed under enforcing.
(
    trap 'test -d "${TMP_DIR}" && rm -r "${TMP_DIR}"' EXIT
    TMP_DIR="$(mktemp -d)"
    readonly TMP_DIR
    cd "${TMP_DIR}"
    cp "${SELINUX_SRC}/${SELINUX_MODULE}.te" "${SELINUX_SRC}/${SELINUX_MODULE}.fc" ./
    checkmodule -M -m -o "${SELINUX_MODULE}.mod" "${SELINUX_MODULE}.te"
    semodule_package -m "${SELINUX_MODULE}.mod" -f "${SELINUX_MODULE}.fc" -o "${SELINUX_MODULE}.pp"
    semodule -i "${SELINUX_MODULE}.pp"
)
restorecon /usr/sbin/zabbix_agent2

# Point the agent at the SI monitoring server (plain, no TLS - matches si-3dpr01).
sed -i -E "s|^#?[[:space:]]*Server=.*|Server=${ZABBIX_SERVER}|" "${AGENT_CONF}"
sed -i -E "s|^#?[[:space:]]*ServerActive=.*|ServerActive=${ZABBIX_SERVER}|" "${AGENT_CONF}"
sed -i -E "s|^#?[[:space:]]*Hostname=.*|Hostname=${ZABBIX_HOSTNAME}|" "${AGENT_CONF}"

systemctl enable --now zabbix-agent2
systemctl restart zabbix-agent2

echo "Zabbix Agent 2 installed and enrolled (server=${ZABBIX_SERVER}, hostname=${ZABBIX_HOSTNAME})"
