# Security and domain boundary

This repository does not claim healthcare, FHIR, IHSS, EVV, HIPAA, or regulated clinical-data compliance. Those concepts came from generated prototype pages and are absent from the executable server and frontend. Do not use this service for clinical/care decisions, consent, contraindications, medication, eligibility, or protected health information.

The bounded workflow handles installation-customer contact and address data. Public registration is closed; access tokens are short-lived and the active database role is resolved on every request. Only managers/admins can read scheduling records or book, and only admins can export the audit chain. Inputs, bodies, timestamps, dates, durations, amounts, versions, and idempotency keys are bounded. Audit metadata deliberately excludes contact, email, phone, address, and budget.

Helmet, exact CORS origins, authentication throttling, bounded JSON, safe 5xx responses, request IDs, explicit proxy trust, loopback defaults, and non-sensitive structured logs are enabled. Generic LLM/AI routes are not executable and no customer or workforce record is sent to a model provider.

Deployment owners must supply TLS, PostgreSQL TLS and encryption at rest, separate migration/runtime/backup identities, a secret manager and rotation, centralized access-controlled logs, retention/deletion policy, customer privacy notices, access reviews, vulnerability/base-image monitoring, incident response and notification procedures, and tested recovery objectives. Report vulnerabilities privately without live credentials or customer data.
