// Vercel Serverless Function: /api/anthropic
// Proxies requests to Anthropic API so the key never touches the browser

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel environment variables' });
  }

  try {
    const body = req.body;

    // Enforce model and safety limits
    const payload = {
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: Math.min(body.max_tokens || 1000, 4096),
      messages: body.messages || [],
      ...(body.tools ? { tools: body.tools } : {}),
      ...(body.system ? { system: body.system } : {})
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Anthropic API error',
        type: data.error?.type
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Anthropic proxy error:', error);
    return res.status(500).json({ error: 'Internal proxy error', detail: error.message });
  }
}
