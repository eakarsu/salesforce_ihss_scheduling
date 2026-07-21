#!/usr/bin/env bash
set -euo pipefail

if [[ "${ALLOW_DISPOSABLE_RESTORE:-}" != 'YES' || -z "${RESTORE_DATABASE_URL:-}" || -z "${BACKUP_FILE:-}" ]]; then echo 'ALLOW_DISPOSABLE_RESTORE=YES, RESTORE_DATABASE_URL, and BACKUP_FILE are required.' >&2; exit 2; fi
if [[ ! -f "${BACKUP_FILE}" ]]; then echo 'BACKUP_FILE does not exist.' >&2; exit 2; fi
database_name="$(psql "${RESTORE_DATABASE_URL}" -Atqc 'select current_database()')"
if [[ ! "${database_name}" =~ ^installation_scheduling_restore_verify_[a-zA-Z0-9_]+$ ]]; then echo 'Refusing restore: target database must use the installation_scheduling_restore_verify_ prefix.' >&2; exit 2; fi
pg_restore --dbname="${RESTORE_DATABASE_URL}" --clean --if-exists --no-owner --no-privileges "${BACKUP_FILE}"
psql "${RESTORE_DATABASE_URL}" -v ON_ERROR_STOP=1 -Atqc "SELECT to_regclass('public.schema_migrations') IS NOT NULL" | grep -qx t
psql "${RESTORE_DATABASE_URL}" -v ON_ERROR_STOP=1 -Atqc "SELECT to_regclass('public.service_appointments') IS NOT NULL" | grep -qx t
psql "${RESTORE_DATABASE_URL}" -v ON_ERROR_STOP=1 -Atqc "SELECT to_regclass('public.scheduling_audit_events') IS NOT NULL" | grep -qx t
echo 'Disposable restore structural verification passed.'
