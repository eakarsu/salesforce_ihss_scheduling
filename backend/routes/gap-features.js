// === Batch 11 Gaps & Frontend Mounts ===
// Gap features (AI counterparts + Non-AI features) for salesforce_ihss_scheduling.
// Lazy gap_features table (in-memory), OpenRouter via native fetch.

const express = require('express');
const router = express.Router();

const gapFeatures = new Map();

async function llm(systemPrompt, userMsg, maxTokens = 1400) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { const e = new Error('OPENROUTER_API_KEY not configured'); e.status = 503; throw e; }
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'salesforce_ihss_scheduling Gap Features' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }], max_tokens: maxTokens }),
  });
  const data = await r.json();
  if (data && data.error) throw new Error(data.error.message || 'LLM error');
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

function track(slug, payload) {
  const list = gapFeatures.get(slug) || [];
  list.push({ at: new Date().toISOString(), payload });
  gapFeatures.set(slug, list);
}

function safe(res, e) { return res.status((e && e.status) || 500).json({ error: (e && e.message) || 'request failed' }); }

// ---- AI Gap Counterparts ----

router.post('/gap-client-noshow-prediction', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You predict client no-show risk for upcoming visits based on history and weather.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('client-noshow-prediction', { keys: Object.keys(body) });
    res.json({ risk: out });
  } catch (e) { safe(res, e); }
});

router.post('/gap-workforce-attrition', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You predict caregiver attrition risk based on absence and timesheet patterns.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('workforce-attrition', { keys: Object.keys(body) });
    res.json({ risk: out });
  } catch (e) { safe(res, e); }
});

router.post('/gap-incident-summarizer', async (req, res) => {
  try {
    const body = req.body || {};
    const sys = "You summarize safety/medical incident reports and recommend escalation steps.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('incident-summarizer', { keys: Object.keys(body) });
    res.json({ summary: out });
  } catch (e) { safe(res, e); }
});

// ---- Non-AI Gap Features ----

router.post('/gap-mobile-rn-client', (req, res) => {
  const body = req.body || {};
  const record = { id: 'mobile-rn-client_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('mobile-rn-client', record);
  res.json({ event: record, status: 'recorded' });
});

router.post('/gap-client-portal', (req, res) => {
  const body = req.body || {};
  const record = { id: 'client-portal_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('client-portal', record);
  res.json({ request: record, status: 'recorded' });
});

router.post('/gap-payroll-connector', (req, res) => {
  const body = req.body || {};
  const record = { id: 'payroll-connector_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('payroll-connector', record);
  res.json({ syncJob: record, status: 'recorded' });
});

router.post('/gap-compliance-tracker', (req, res) => {
  const body = req.body || {};
  const record = { id: 'compliance-tracker_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('compliance-tracker', record);
  res.json({ cert: record, status: 'recorded' });
});

router.post('/gap-rate-analytics', (req, res) => {
  const body = req.body || {};
  const record = { id: 'rate-analytics_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('rate-analytics', record);
  res.json({ metric: record, status: 'recorded' });
});

router.get('/gap-features/_audit', (req, res) => {
  const rows = [];
  for (const [k, v] of gapFeatures.entries()) rows.push({ feature: k, events: v.length });
  res.json({ rows });
});

module.exports = router;
