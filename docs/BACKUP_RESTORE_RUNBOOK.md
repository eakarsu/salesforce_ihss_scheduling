# Backup and restore

Store encrypted backups outside the repository under operator-controlled retention and access policy:

```bash
DATABASE_URL='postgresql://...' BACKUP_OUTPUT_DIR='/absolute/secure/path' ./scripts/backup-postgres.sh
```

Verify the SHA-256 manifest before a restore drill. Create a new isolated database whose name starts with `installation_scheduling_restore_verify_`, then run:

```bash
ALLOW_DISPOSABLE_RESTORE=YES \
RESTORE_DATABASE_URL='postgresql://.../installation_scheduling_restore_verify_2026q3' \
BACKUP_FILE='/absolute/secure/path/installation-scheduling-....dump' \
./scripts/verify-restore.sh
```

Run `npm run migrate:check --prefix backend` against the restored database, verify retained users/work orders/appointments/audit events and audit-chain validity, record duration and RPO/RTO comparison, then dispose only the explicitly created drill database. The scripts never create or drop databases.
