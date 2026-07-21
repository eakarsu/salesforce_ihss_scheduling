# Installation scheduling

Despite the historical repository name, this is a home-improvement installation scheduler—not an IHSS, healthcare, clinical, FHIR, or care-management product. The executable scope is intentionally limited to one workflow: an authorized dispatch manager selects a pending work order, receives deterministic skill/territory/operating-hours/absence/conflict-aware slots, confirms customer details, and books an idempotent appointment. An administrator can inspect the PII-minimized immutable audit chain.

Historical broad CRUD and generic AI source remains only where needed to preserve repository history; it is not mounted by the server or frontend.

## Acceptance criteria

- Public registration is disabled. Short-lived tokens identify active database users; only `admin` and `manager` roles can view customer scheduling records or book.
- Slot calculation is deterministic and uses an explicit territory timezone, active territory membership, required skills, operating hours, absences, existing appointments, duration, and buffers.
- Booking repeats every safety check, requires an optimistic work-order version and idempotency key, serializes per resource, and rejects stale, ineligible, absent, out-of-window, malformed, or overlapping requests.
- Retrying the identical request returns the original appointment. Reusing its key for changed input fails.
- Customer contact/address fields never enter the audit metadata. Each successful booking appends an immutable, recomputable SHA-256 audit event.
- Normal startup is non-destructive and checks migration/checksum/schema drift before listening.

## Preparation

Requirements: Node.js 20.19+, PostgreSQL 14+, and PostgreSQL client utilities for recovery drills.

```bash
cp .env.example .env
npm ci --prefix backend
npm ci --prefix frontend
npm run migrate --prefix backend
npm run build --prefix frontend
./start.sh
```

Migrations are explicit. Startup never installs dependencies, creates a database, migrates forward, loads fixtures, kills processes, or starts machine services. `backend/db/fixtures.js` is limited to an empty disposable verification database and requires both `ALLOW_FIXTURE_SEED=YES` and a 16+ character `FIXTURE_PASSWORD`.

See `SECURITY.md`, `docs/OPERATIONS_RUNBOOK.md`, and `docs/BACKUP_RESTORE_RUNBOOK.md` before staging or production use.
