const fetch = require('node-fetch');
require('dotenv').config({ path: __dirname + '/../.env' });

async function aiQuery(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    const error = new Error('AI service unavailable: OPENROUTER_API_KEY is not configured');
    error.statusCode = 503;
    throw error;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:4002',
        'X-Title': 'Lowes Installation Services',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || `AI provider returned ${response.status}`);

    const content = data.choices?.[0]?.message?.content || 'No response from AI';
    return { success: true, result: content, model: data.model, usage: data.usage };
  } catch (err) {
    const error = new Error(`AI provider request failed: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { aiQuery };
