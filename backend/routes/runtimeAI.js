const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../db');

router.post('/recommendation', auth, async (req, res, next) => {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt || prompt.length > 4000) return res.status(400).json({ error: 'Prompt must contain 1-4000 characters', code: 'INVALID_PROMPT' });
    const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
    const model = String(process.env.OPENROUTER_MODEL || '').trim();
    const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
    if (!apiKey || !model || !baseUrl) return res.status(503).json({ error: 'AI provider is not configured', code: 'AI_NOT_CONFIGURED' });
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': `http://127.0.0.1:${process.env.FRONTEND_PORT}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Give concise scheduling operations guidance. Do not make safety, legal, or care decisions.' }, { role: 'user', content: prompt }], max_tokens: 180 }),
      signal: AbortSignal.timeout(45000),
    });
    const payload = await response.json().catch(() => ({}));
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !payload.id || !content) { const error = new Error(`OpenRouter request failed with HTTP ${response.status}`); error.code = 'AI_PROVIDER_FAILURE'; throw error; }
    const receipt = await pool.query(
      `INSERT INTO ai_provider_receipts(user_id,provider,provider_request_id,model,prompt,content)
       VALUES($1,'openrouter',$2,$3,$4,$5) RETURNING id,provider,provider_request_id,model,created_at`,
      [req.user.id, String(payload.id), String(payload.model || model), prompt, content],
    );
    res.json({ content, receipt: receipt.rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;
