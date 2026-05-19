// AI Extras — Custom Feature Suggestions (batch 11)
// Intelligent Shift Scheduling Agent, Mobile Crew App, Demand Prediction & Staffing,
// Client Self-Service Portal, Compliance & Safety Monitoring, Real-Time Incident Alerts.

const express = require('express');
const router = express.Router();
const { aiQuery } = require('../openrouter');

const SYSTEM_PROMPTS = {
  'shift-optimizer': "You are a workforce scheduling optimizer for in-home services. Given crew, territory, skill, absence, and time-window constraints, produce a balanced shift assignment that minimizes empty shifts and travel. Output JSON: { assignments, conflicts, recommendations }.",
  'demand-prediction': "You are a demand-prediction analyst. Forecast peak service-request days by territory and skill; propose proactive staffing additions. Output JSON: { forecast, hotspots, staffingRecommendations }.",
  'compliance-monitor': "You are a workforce compliance monitor. From recent hours, training records, and absence patterns, flag potential overtime / recertification / safety-training violations. Output JSON: { violations, expiringCerts, recommendedActions }.",
  'incident-classifier': "You are a field-incident triage AI. From incident description + photos count + severity tags, classify (medical, safety, behavioral, property), priority (1-5), and recommended escalation path. Output JSON.",
};

// 1) Intelligent Shift Scheduling Agent
router.post('/shift-optimize', async (req, res) => {
  try {
    const { crews = [], shifts = [], territory, constraints = {} } = req.body || {};
    if (!crews.length || !shifts.length) return res.status(400).json({ error: 'crews[] and shifts[] required' });
    const user = `Territory: ${territory || 'all'}\nCrews: ${JSON.stringify(crews).slice(0, 4000)}\nShifts: ${JSON.stringify(shifts).slice(0, 4000)}\nConstraints: ${JSON.stringify(constraints)}`;
    const ai = await aiQuery(SYSTEM_PROMPTS['shift-optimizer'], user);
    res.json(ai);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2) Mobile Crew App endpoints (GPS, time clock, photo capture, incident reporting)
const clockEvents = new Map(); // crewId -> events[]
router.post('/crew-app/clock', async (req, res) => {
  const { crewId, type, gps, timestamp } = req.body || {};
  if (!crewId || !['in', 'out', 'break_start', 'break_end'].includes(type)) {
    return res.status(400).json({ error: 'crewId and valid type required' });
  }
  const events = clockEvents.get(crewId) || [];
  events.push({ type, gps, at: timestamp || new Date().toISOString() });
  clockEvents.set(crewId, events);
  res.json({ events });
});
router.post('/crew-app/photo', async (req, res) => {
  const { crewId, workOrderId, photoBase64Sha, caption } = req.body || {};
  if (!crewId || !workOrderId) return res.status(400).json({ error: 'crewId and workOrderId required' });
  res.json({ crewId, workOrderId, capturedAt: new Date().toISOString(), photoBase64Sha: photoBase64Sha || null, caption });
});
router.post('/crew-app/incident', async (req, res) => {
  try {
    const { crewId, workOrderId, description, severityTag = 'low', photoCount = 0 } = req.body || {};
    if (!description) return res.status(400).json({ error: 'description required' });
    const user = `Crew: ${crewId}\nWO: ${workOrderId}\nDescription: ${description}\nSeverity tag: ${severityTag}\nPhotos: ${photoCount}`;
    const ai = await aiQuery(SYSTEM_PROMPTS['incident-classifier'], user);
    res.json(ai);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3) Demand Prediction & Staffing
router.post('/demand-staffing', async (req, res) => {
  try {
    const { history = [], horizonDays = 14, currentStaffing = {} } = req.body || {};
    if (!history.length) return res.status(400).json({ error: 'history[] required' });
    const user = `Horizon: ${horizonDays} days\nStaffing: ${JSON.stringify(currentStaffing)}\nHistory: ${JSON.stringify(history).slice(0, 6000)}`;
    const ai = await aiQuery(SYSTEM_PROMPTS['demand-prediction'], user);
    res.json(ai);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4) Client Self-Service Portal — booking + ratings.
const bookings = new Map();
const ratings = new Map();
router.post('/portal/request-service', async (req, res) => {
  const { clientId, serviceTypes = [], preferredWindow, notes } = req.body || {};
  if (!clientId || !serviceTypes.length) return res.status(400).json({ error: 'clientId and serviceTypes[] required' });
  const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  bookings.set(id, { id, clientId, serviceTypes, preferredWindow, notes, status: 'pending', createdAt: new Date().toISOString() });
  res.json({ booking: bookings.get(id) });
});
router.post('/portal/rate', async (req, res) => {
  const { clientId, caregiverId, rating, feedback } = req.body || {};
  if (!clientId || !caregiverId || rating == null) return res.status(400).json({ error: 'clientId, caregiverId, rating required' });
  const key = `${clientId}_${caregiverId}`;
  const list = ratings.get(key) || [];
  list.push({ rating: Number(rating), feedback, at: new Date().toISOString() });
  ratings.set(key, list);
  res.json({ stored: list.length });
});

// 5) Compliance & Safety Monitoring
router.post('/compliance-monitor', async (req, res) => {
  try {
    const { timesheets = [], certifications = [], absences = [] } = req.body || {};
    const user = `Timesheets: ${JSON.stringify(timesheets).slice(0, 4000)}\nCerts: ${JSON.stringify(certifications).slice(0, 3000)}\nAbsences: ${JSON.stringify(absences).slice(0, 2000)}`;
    const ai = await aiQuery(SYSTEM_PROMPTS['compliance-monitor'], user);
    res.json(ai);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6) Real-Time Incident Alerts — webhook receiver + AI triage handoff.
// TODO: configure credentials — ALERT_WEBHOOK_SECRET, AMBULANCE_DISPATCH_API_KEY.
router.post('/alert/incoming', async (req, res) => {
  const secret = process.env.ALERT_WEBHOOK_SECRET;
  if (secret && req.headers['x-alert-secret'] !== secret) return res.status(401).json({ error: 'invalid alert secret' });
  const { sourceCrewId, severityHint, transcriptOrText, location } = req.body || {};
  if (!transcriptOrText) return res.status(400).json({ error: 'transcriptOrText required' });
  try {
    const ai = await aiQuery(SYSTEM_PROMPTS['incident-classifier'], `Crew: ${sourceCrewId}\nLocation: ${JSON.stringify(location)}\nSeverityHint: ${severityHint}\nText: ${transcriptOrText.slice(0, 6000)}`);
    res.json({ triage: ai, receivedAt: new Date().toISOString(), ambulanceApiConfigured: !!process.env.AMBULANCE_DISPATCH_API_KEY });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
