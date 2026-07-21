# Audit Note - salesforce_ihss_scheduling

The original audit backlog and generated additions treated this repository as an IHSS/healthcare application. Repository-owned scheduling data, seed fixtures, labels, and core workflows instead describe Lowe's home-improvement installation services.

The healthcare/EVV gap pages, in-memory custom views, fake mobile portal state, and notification/GPS/payroll endpoints that only acknowledged credentials were removed in the completeness pass. They were not working integrations and must not be represented as implemented.

The supported boundary is now the persistent installation scheduling workflow: authenticated staff can manage resources and work orders, calculate availability, and book non-overlapping appointments. AI features are optional operator advisories, return 503 without a configured provider, and are not an automated decision system. Any future provider integration needs its own durable adapter, delivery acknowledgement, retry/idempotency behavior, privacy review, and contract tests before it is mounted.
