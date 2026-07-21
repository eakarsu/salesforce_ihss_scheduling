# Operations runbook

1. Provision an isolated PostgreSQL database. Run migrations with a controlled DDL identity, then use a least-privileged runtime identity able to access only the bounded tables/functions. Never point fixtures or restore verification at a retained environment.
2. Supply a random 32+ character `JWT_SECRET`, exact `CORS_ORIGINS`, PostgreSQL TLS configuration, and TLS ingress. Leave `TRUST_PROXY=false` unless an operator-controlled proxy overwrites forwarded headers.
3. Run reproducible installs, `npm run migrate --prefix backend`, `npm run migrate:check --prefix backend`, backend tests, frontend build, low-threshold audits, container build, and current/history secret scans.
4. Provision staff out of band with bcrypt hashes and one of `admin`, `manager`, or `viewer`. The application intentionally has no registration or password-reset surface; integrate an approved identity lifecycle before production.
5. In staging, complete login → work order → slots → confirmation → booking. Retry the same key/body and verify a duplicate-safe response. Verify another booking cannot overlap, audit verification is valid, and no customer PII appears in audit metadata/logs.
6. Alert on authentication throttling, 401/403 changes, 409 conflict/retry rates, 5xx responses, database-unavailable health, audit-chain failure, migration drift, and backup failures.

`VERSION_CONFLICT` requires refreshing slots. `SERIALIZATION_RETRY` permits retrying the identical idempotent request. Other 409 results require operator review; never bypass resource eligibility, absence, buffer, work-order state, or operating-hour checks.
