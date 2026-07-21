const express = require('express');
const router = express.Router();
const { aiQuery } = require('../openrouter');

const SYSTEM_PROMPTS = {
  'optimize-schedule': "You are a workforce scheduling optimizer for Lowe's Installation Services. Given a list of pending service appointments, available resources, territories, and constraints, propose an optimized assignment that maximizes territory coverage and skill matching while minimizing travel and overtime. Output structured sections: Summary, Assignments, Conflicts, Recommendations.",
  'predict-demand': "You are a service-demand forecaster for an in-home installation services operation. Using the historical context provided, predict expected demand by territory, work type, and time window for the requested horizon. Output structured sections: Forecast Table, Drivers, Confidence, Staffing Implications.",
  'find-backup-resource': "You are an operations dispatcher for in-home services. Given a service appointment whose primary resource is unavailable, propose backup service-resource candidates ranked by skill match, territory proximity, current load, and absence calendar. Output structured sections: Top Candidates (with rationale), Tradeoffs, Recommended Action.",
};

// POST /api/ai/optimize-schedule
router.post('/optimize-schedule', async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'context is required (object describing appointments, resources, constraints)' });
    }
    const userPrompt = `Scheduling context:\n${JSON.stringify(context, null, 2)}\n\nProduce an optimized schedule.`;
    const ai = await aiQuery(SYSTEM_PROMPTS['optimize-schedule'], userPrompt);
    res.json(ai);
  } catch (err) {
    console.error('optimize-schedule error:', err);
    res.status(err.statusCode || 502).json({ error: err.message });
  }
});

// POST /api/ai/predict-demand
router.post('/predict-demand', async (req, res) => {
  try {
    const { history, horizon } = req.body;
    if (!history) {
      return res.status(400).json({ error: 'history is required (object with prior appointments/work orders)' });
    }
    const userPrompt = `Historical data:\n${JSON.stringify(history, null, 2)}\n\nForecast horizon: ${horizon || 'next 14 days'}.\nProduce a demand forecast.`;
    const ai = await aiQuery(SYSTEM_PROMPTS['predict-demand'], userPrompt);
    res.json(ai);
  } catch (err) {
    console.error('predict-demand error:', err);
    res.status(err.statusCode || 502).json({ error: err.message });
  }
});

// POST /api/ai/find-backup-resource
router.post('/find-backup-resource', async (req, res) => {
  try {
    const { appointment, candidates } = req.body;
    if (!appointment) {
      return res.status(400).json({ error: 'appointment is required (object)' });
    }
    const userPrompt = `Appointment needing backup:\n${JSON.stringify(appointment, null, 2)}\n\nAvailable candidate resources:\n${JSON.stringify(candidates || [], null, 2)}\n\nPropose ranked backups.`;
    const ai = await aiQuery(SYSTEM_PROMPTS['find-backup-resource'], userPrompt);
    res.json(ai);
  } catch (err) {
    console.error('find-backup-resource error:', err);
    res.status(err.statusCode || 502).json({ error: err.message });
  }
});

// POST /api/ai/skill-gap-analyzer — training-needs analysis from a roster + requirements
router.post('/skill-gap-analyzer', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { roster, required_skills, target_certifications, work_mix } = req.body;
    if (!roster || !Array.isArray(roster) || roster.length === 0) {
      return res.status(400).json({ error: 'roster (non-empty array) is required' });
    }
    const system = "You are a workforce-development analyst for in-home installation services. Identify skill gaps relative to required capabilities and recommend prioritized training, cross-training pairs, and certification timelines. Output structured sections: Gap Summary, Per-Resource Gaps, Recommended Training Plan (priority + timeline), Cross-Training Pairs, Risk Areas.";
    const userPrompt = `ROSTER:\n${JSON.stringify(roster, null, 2)}\n\nREQUIRED SKILLS:\n${JSON.stringify(required_skills || [], null, 2)}\n\nTARGET CERTIFICATIONS:\n${JSON.stringify(target_certifications || [], null, 2)}\n\nWORK MIX (optional):\n${JSON.stringify(work_mix || {}, null, 2)}\n\nProduce a skill-gap analysis.`;
    const ai = await aiQuery(system, userPrompt);
    res.json(ai);
  } catch (err) {
    console.error('skill-gap-analyzer error:', err);
    res.status(err.statusCode || 502).json({ error: err.message });
  }
});

// PRODUCT-DECISION: Rate / labor-cost AI advisor. Computes per-territory cost
// commentary using AI. Real rate persistence belongs in a future schema change;
// this endpoint accepts {rates: [{work_type, hourly_rate, territory}], hours: [...]}
// and is stateless.
router.post('/rate-advisor', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { rates, hours, territory } = req.body || {};
    if (!rates && !hours) {
      return res.status(400).json({ error: 'rates or hours is required' });
    }
    const system = 'You are a labor-cost analyst for in-home installation services. Given hourly rate cards and worked hours, compute estimated total labor cost, identify high-cost work types, and suggest cost-control levers. Output structured sections: Cost Summary, By Work Type, Territory Comparison (if applicable), Recommendations.';
    const userPrompt = `RATES:\n${JSON.stringify(rates || [], null, 2)}\n\nHOURS:\n${JSON.stringify(hours || [], null, 2)}\n\nTERRITORY: ${territory || 'all'}\n\nProduce a labor-cost analysis.`;
    const ai = await aiQuery(system, userPrompt);
    res.json(ai);
  } catch (err) {
    console.error('rate-advisor error:', err);
    res.status(err.statusCode || 502).json({ error: err.message });
  }
});

module.exports = router;
