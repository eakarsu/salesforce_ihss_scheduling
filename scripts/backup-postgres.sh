#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_OUTPUT_DIR:?BACKUP_OUTPUT_DIR is required}"
if [[ "${BACKUP_OUTPUT_DIR}" != /* || "${BACKUP_OUTPUT_DIR}" == '/' ]]; then echo 'BACKUP_OUTPUT_DIR must be a specific absolute path outside the repository.' >&2; exit 2; fi
mkdir -p -- "${BACKUP_OUTPUT_DIR}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
final_path="${BACKUP_OUTPUT_DIR}/installation-scheduling-${timestamp}.dump"
partial_path="${final_path}.partial"
trap 'rm -f -- "${partial_path}"' EXIT
pg_dump --dbname="${DATABASE_URL}" --format=custom --no-owner --no-privileges --file="${partial_path}"
mv -- "${partial_path}" "${final_path}"
trap - EXIT
if command -v sha256sum >/dev/null 2>&1; then sha256sum "${final_path}" > "${final_path}.sha256"; else shasum -a 256 "${final_path}" > "${final_path}.sha256"; fi
echo 'Backup and SHA-256 manifest created in the operator-controlled directory.'
