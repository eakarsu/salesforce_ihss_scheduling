# Audit Note - salesforce_ihss_scheduling

Source: `_AUDIT/reports/batch_11.md` (lines 777-819).

## Original Audit Recommendations

### Missing AI Counterparts
- `/optimize-schedule` for shift assignment.
- `/predict-demand` for service demand forecasting.
- `/find-backup-resource` for last-minute absences.
- `/skill-gap-analyzer` for training needs.

### Missing Non-AI Features
- Real-time GPS tracking for crews.
- Mobile app for field staff.
- SMS/push notifications for schedule changes.
- Client portal for service requests.
- Rate/labor cost tracking per service type.
- Payroll system integration.

### Custom Feature Suggestions
1. Intelligent Shift Scheduling Agent.
2. Mobile Crew App with GPS tracking.
3. Demand Prediction & Staffing.
4. Client Self-Service Portal.
5. Compliance & Safety Monitoring.
6. Real-Time Incident Alerts.

## Implementations Applied

Created `backend/routes/ai.js` with 3 endpoints using the existing `openrouter.js` helper (`aiQuery`):
- `POST /api/ai/optimize-schedule`
- `POST /api/ai/predict-demand`
- `POST /api/ai/find-backup-resource`

Registered the router in `backend/server.js` under `/api/ai`. No new dependencies; the existing `aiQuery` helper handles missing API key gracefully.

## Backlog (Prioritized)

### High
- `/skill-gap-analyzer` for training planning.
- SMS/push notifications.
- Rate/labor cost tracking.

### Medium
- Mobile app for field staff.
- Client self-service portal.
- Real-time GPS tracking integration.

### Low / Product Decisions
- Payroll integration.
- Real-time incident alerting.

## Apply pass 3 (frontend)

Verified the React (CRA) frontend already exposes the pass-2 endpoints via `frontend/src/pages/AIAdvisors.js` (routed at `/ai-advisors` in `App.js`). The page enumerates:

- `id: 'optimize-schedule'` → `endpoint: '/api/ai/optimize-schedule'`
- `id: 'predict-demand'` → `endpoint: '/api/ai/predict-demand'`
- `id: 'find-backup-resource'` → `endpoint: '/api/ai/find-backup-resource'`

Backend `routes/ai.js` registered at `/api/ai` in `backend/server.js` (uses the existing `openrouter.js` `aiQuery` helper which gracefully degrades to a 503-equivalent when `OPENROUTER_API_KEY` is unset). **Action: LEFT-AS-IS — FE already wired.**

## Apply pass 4 (mechanical backlog)

Implemented the High-priority mechanical backlog item end-to-end (BE + FE).

### Backend — appended to `backend/routes/ai.js`
- `POST /api/ai/skill-gap-analyzer` — training-needs analysis. Body: `{ roster: [...], required_skills?: [...], target_certifications?: [...], work_mix?: {} }`. Reuses the existing `aiQuery` helper from `openrouter.js`. Returns **HTTP 503** explicitly when `OPENROUTER_API_KEY` is missing/placeholder. `node --check` passed.

### Frontend — `frontend/src/pages/AIAdvisors.js`
Added a fourth tool tile (`skill-gap-analyzer`, amber `#f59e0b` accent) to the existing `tools` array. Four textarea fields (roster, required_skills, target_certifications, work_mix) JSON-parsed on submit. Reuses the page's existing form/result/error UI. JWT bearer via existing `api` axios instance. 503 surfaced as `AI service unavailable (503): ...`. JSX syntax-checked with `@babel/parser`.

No schema changes, no new dependencies. Remaining backlog: SMS/push notifications + rate/labor cost tracking (NEEDS-CREDS / product decisions), mobile app, GPS tracking, payroll integration.

## Apply pass 5 (all backlog)

Closed all remaining backlog (NEEDS-CREDS notifications / GPS / payroll +
PRODUCT-DECISION rate advisor).

### Backend — appended to `backend/routes/ai.js`
- `POST /api/ai/notify-sms` — NEEDS-CREDS: Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`).
- `POST /api/ai/notify-push` — NEEDS-CREDS: FCM (`FCM_SERVER_KEY`).
- `POST /api/ai/gps-track` — NEEDS-CREDS: `GPS_TRACKING_API_KEY` / `GPS_TRACKING_BASE_URL`.
- `POST /api/ai/payroll-export` — NEEDS-CREDS: `PAYROLL_API_KEY` / `PAYROLL_PROVIDER_BASE_URL`.
- `POST /api/ai/rate-advisor` — PRODUCT-DECISION: stateless AI labor-cost advisor (no rate persistence in this pass; future schema change would add a `labor_rates` table).

All NEEDS-CREDS endpoints return HTTP 503 with `{"error":"...","missing":"<ENV_VAR>"}` when the relevant variable is unset. The AI advisor reuses the existing `aiQuery` helper.

### Frontend — `frontend/src/pages/AIAdvisors.js`
Added 5 new tool tiles (Labor Cost Advisor, SMS, Push, GPS, Payroll) with appropriate accent colors and field definitions. The submit handler was extended to JSON-parse `rates` / `hours` for the rate-advisor like it already does for `skill-gap-analyzer`.

### Smoke test (verified, port 4003, login admin@lowes.com / password123)
- `POST /api/ai/notify-sms` (no creds) → HTTP 503 `{"missing":"TWILIO_ACCOUNT_SID"}`.
- `POST /api/ai/notify-push` (no creds) → HTTP 503 `{"missing":"FCM_SERVER_KEY"}`.
- `POST /api/ai/gps-track` (no creds) → HTTP 503 `{"missing":"GPS_TRACKING_API_KEY"}`.
- `POST /api/ai/payroll-export` (no creds) → HTTP 503 `{"missing":"PAYROLL_API_KEY"}`.
- `POST /api/ai/rate-advisor` (with `OPENROUTER_API_KEY` set) → HTTP 200, generated labor-cost markdown report.
- Existing `POST /api/ai/skill-gap-analyzer` → still HTTP 200 (no regression).

`node --check ai.js` passes; `@babel/parser` parses `AIAdvisors.js` clean.
