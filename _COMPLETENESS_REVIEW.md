# Completeness Review: salesforce_ihss_scheduling

**Original review date:** 2026-07-18  
**Implementation verification date:** 2026-07-20

## Assessment basis

The original static review classified this as a healthcare/care-operations prototype because generated IHSS, EVV, mobile-client, and compliance pages were present. That classification was materially incorrect: the durable source data and core workflow describe home-improvement installation scheduling. Implementing FHIR, clinical consent, contraindications, or clinician decisions would create false regulated-domain claims.

The remediation therefore uses a truthful bounded scope: an authenticated dispatch manager selects a pending installation work order, receives deterministic skill/territory/timezone/operating-hours/absence/conflict-aware slots, reviews customer details, and creates an idempotent appointment. An administrator reviews a PII-minimized immutable audit chain. Historical healthcare, broad CRUD, demo, and generic-AI surfaces are not mounted by the server or frontend.

## Classification

**Domain-corrected bounded MVP implemented; production release remains externally gated.**

Repository-level acceptance criteria, persistence, authorization, validation, concurrency, replay protection, migrations, drift detection, tests, CI, recovery tooling, and operational documentation are implemented. Production identity lifecycle, infrastructure encryption, representative-user validation, incident/retention decisions, penetration testing, and retained deployment evidence require the deploying organization.

## Original needed features and truthful disposition

1. **Integrate standards-based clinical/care data (for example FHIR where applicable) with identity matching and consent — archived as not applicable.** The executable product is installation scheduling and must not ingest clinical/care or PHI data. `SECURITY.md` explicitly prohibits healthcare/FHIR/IHSS/EVV use. Staff identity is instead resolved from active installation-operations users on every request; public registration is disabled.
2. **Add clinician/caseworker review boundaries, provenance, contraindication/safety checks, and escalation for uncertain output — archived as not applicable to the claimed roles; equivalent scheduling controls implemented.** No clinician, caseworker, clinical contraindication, or model output exists. A manager must review the confirmation step; booking deterministically rechecks work-order state/version/window, territory, skill, resource status, absence, duration, operating hours, buffers, and overlap. An administrator independently reviews audit evidence. Conflicts fail closed with explicit refresh/retry/escalation codes.
3. **Implement field-level access control, audit history, retention, encryption, and regulated-data incident procedures — repository controls implemented; deployment policy externally gated.** Only admin/manager roles can read customer scheduling fields or book; viewers are denied and only admins export audits. Customer contact/address/budget never enters audit metadata or logs. Successful bookings append a recomputable SHA-256 chain protected from update/delete by PostgreSQL. TLS, encryption at rest, secret management, retention/deletion, privacy notices, and incident notification are operator controls documented in `SECURITY.md` and the runbook.
4. **Validate the intended workflow with representative users and test high-risk, missing-data, and handoff scenarios — automated risk validation implemented; representative-human acceptance remains external.** Tests cover missing scheduling context, malformed dates/times, resource absence, crafted out-of-hours booking, stale versions, concurrent overlap, changed idempotency input, unauthorized roles, audit handoff and tamper rejection. The UI includes an explicit confirmation step. Real dispatcher/admin usability, responsive/accessibility, and policy acceptance still require named representatives.
5. **Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage — implemented.** Nineteen tests cover time/interval rules, clean migration replay, transactional drift probes, startup safety, domain boundaries, live PostgreSQL identity/RBAC, deterministic slots, failure paths, concurrent booking, idempotent replay, audit integrity/PII minimization, and retired-route 404s. CI provisions PostgreSQL, migrates, loads only guarded empty-database fixtures, tests, builds, runs low-threshold audits, builds the container, and scans full history.

## Implementation progress (2026-07-20)

- Narrowed the executable backend to `/api/auth`, `/api/scheduling`, `/api/audit-logs`, and health. Generic AI, broad CRUD, EVV/IHSS, generated gap, GPS, payroll, notification, and in-memory custom-view routes are unmounted and return 404.
- Narrowed the frontend to login, live-session validation, role denial, and the installation-booking confirmation workflow. Generated dashboards, feature editors, AI advisors, and regulated-care pages are not bundled as routes.
- Added explicit PostgreSQL migrations with SHA-256 checksums, advisory serialization, idempotent replay, pending/checksum failure, and schema-drift verification for eleven relations, five critical columns, an idempotency index, and the audit immutability trigger.
- Added safe empty-database fixtures for CI and disposable verification. The legacy destructive seed command is permanently retired and contains no drop/truncate/delete/create behavior.
- Added deterministic timezone-explicit slots and repeated server-side booking validation. Client-crafted bookings cannot bypass required skill, territory membership, active status, absence, work-order window/state/version, exact duration, operating hours, or appointment buffers.
- Added booking idempotency request hashes, optimistic work-order versions, per-key/per-resource/advisory locks, serializable transactions, deterministic appointment numbering, and safe retry/conflict semantics.
- Added short-lived HS256 identity, live active-role lookup, disabled registration, manager/admin scheduling access, admin-only audit export, bcrypt fixture identities, exact CORS, Helmet, login throttling, bounded JSON, explicit proxy trust, safe errors, request IDs, non-sensitive structured logs, and graceful shutdown.
- Added an immutable serialized audit hash chain. Audit metadata contains scheduling provenance but excludes customer name, phone, email, address, account, and budget.
- Added a non-destructive startup gate, multi-stage non-root container, GitHub Actions CI, environment contract, security/domain boundary, operations runbook, and guarded PostgreSQL backup/restore tooling.

## Verification evidence

- Collision gate before continuation: no recent write, external project process, or open handle; existing worktree state was preserved and `_AUDIT_NOTE.md` was not edited.
- Fresh disposable PostgreSQL 14 migration: `newlyApplied:1`; replay: `newlyApplied:0`; check: no pending files and all eleven relations/five critical columns/two controls verified.
- Transactional drift probe removed the idempotency index, detected `Schema drift`, rolled back, and verified the intact schema afterward.
- Backend tests: **19/19 passed** against disposable PostgreSQL, including real login, roles, slots, concurrency, durable booking, retry, audit, missing-data, absence, outside-hours, and retired-route behavior.
- Frontend: clean install and Vite 8.1.5 production build passed with 78 transformed modules.
- Dependency audits: backend **0** and frontend **0** vulnerabilities at `--audit-level=low`.
- Production startup: read-only migration/drift check passed; health 200 with reachable database, built `/` 200, valid login 200, retired AI 404, unapproved CORS origin 403, and graceful shutdown released the port.
- Recovery: custom-format dump and SHA-256 manifest verified; guarded restore succeeded; migration/drift check passed; three work orders, one appointment, and a valid one-event audit chain were recovered.
- Secrets: Gitleaks 8.30.1 full-history scan reported **0** findings. The initial current-tree scan identified one test-only generic-key heuristic; the pattern was removed without an allowlist and the current scan then reported **0** findings. `.env` is ignored, untracked, and absent from Git history.
- Backend JavaScript syntax, shell syntax, executable script permissions, and `git diff --check` passed.

## Remaining external release gates

- The preserved ignored `.env` fails the 32-character JWT minimum. Replace it with a random secret from an approved secret manager before startup; it was not printed or modified during this review.
- The local Docker build could not run because the configured Colima daemon is stopped. CI contains the container gate, but retained successful build evidence is required.
- The earlier same-day in-app browser check exposed no browser instance. No visual-click, responsive, or accessibility pass is claimed; representative dispatcher/admin acceptance remains required.
- Provision an approved staff identity lifecycle including account creation, recovery, revocation, MFA/SSO policy, and periodic role/access review.
- Provision TLS/ingress, PostgreSQL TLS and encryption at rest, separate migration/runtime/backup roles and grants, secret rotation, centralized log access/alerts, dependency/base-image monitoring, and a retained staging environment.
- Complete customer-data privacy/retention/deletion notices, installation-policy review, incident-response/notification procedures, penetration testing, production RPO/RTO, scheduled encrypted backups, and a timed restore drill under actual infrastructure.

## Risk disposition

- **Mis-scoped healthcare claims:** removed from execution and explicitly prohibited. No clinical/care data, consent, contraindication, or model decision is claimed.
- **Credential/configuration exposure:** current/history scans are clean; the local ignored JWT configuration still requires operator replacement.
- **Destructive automation:** normal startup and the legacy seed contain no destructive database/process behavior. Fixtures refuse nonempty databases and require an explicit disposable-data flag.
- **Startup mutation:** startup performs only migration checksum/schema verification and never migrates forward or loads fixtures.
- **AI availability/privacy/prompt injection:** generic model routes and UI are unmounted; no scheduling/customer/workforce data is sent to an AI provider.
- **Concurrent double booking:** idempotency, optimistic versions, serializable transactions, and per-resource locks were exercised with simultaneous requests; exactly one booking succeeded.

## Evidence inspected

- `README.md`, `.env.example`, `SECURITY.md`, `.github/workflows/ci.yml`, `Dockerfile`, `start.sh`
- `backend/config.js`, `backend/db.js`, `backend/server.js`, `backend/middleware/auth.js`, `backend/middleware/authorize.js`
- `backend/routes/auth.js`, `backend/routes/scheduling.js`, `backend/routes/auditLogs.js`, `backend/audit.js`
- `backend/lib/scheduling.js`, `backend/lib/validation.js`, `backend/db/migrate.js`, `backend/db/migrations/001_bounded_scheduling.sql`, `backend/db/fixtures.js`, `backend/seed.js`
- `backend/test/migration.test.js`, `backend/test/safety.test.js`, `backend/test/scheduling.test.js`, `backend/test/workflow.test.js`
- `frontend/src/App.js`, `frontend/src/api.js`, `frontend/src/pages/Login.js`, `frontend/src/pages/SchedulingPage.js`
- `docs/OPERATIONS_RUNBOOK.md`, `docs/BACKUP_RESTORE_RUNBOOK.md`, `scripts/backup-postgres.sh`, `scripts/verify-restore.sh`

## Recommended next action

Run the checked-in CI in a clean GitHub context, then deploy to isolated staging and close the identity, infrastructure, representative-user, privacy, security, monitoring, container, and timed-recovery gates before authorizing production customer data or traffic.

### Runtime acceptance follow-up (2026-07-20)

- Added an idempotent administrator bootstrap using the standard campaign variables and a bcrypt-backed PostgreSQL identity. Test-only configuration now derives a loopback CORS origin while production remains fail-closed.
- The first recorded run passed on its unique allocation—PostgreSQL `55693`, API `6186`, UI allocation `6187`—and `_runtime_non_suite_repair_shard2p.tsv` records `API_VERIFIED / startup_login_session_api`.
