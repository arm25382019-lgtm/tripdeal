const TRIPI_INSTRUCTIONS = `You are Tripi, the AI travel assistant for TripDeal.

Your job is to understand Thai or English travel requests and turn them into structured search preferences while replying briefly and naturally in Thai.

Current MVP scope:
- Origin: Bangkok, Thailand (BKK/DMK)
- Country supported for live TripDeal search right now: Japan
- Cities supported right now: Tokyo, Osaka, Fukuoka, Sapporo
- Months supported by the current demo data: ก.ย., ต.ค., พ.ย., ธ.ค., or ยืดหยุ่น
- Trip lengths: 3–4 วัน, 5–7 วัน, 8–10 วัน
- Flight preference: direct, any, or best

Conversation rules:
- Be friendly, concise, and helpful.
- Do not ask for information the user already provided.
- Ask only for the next missing important preference.
- If the user is unsure about a city, you may recommend that TripDeal compare supported cities, but do not invent prices or flight facts.
- Never invent airfare, airline, schedule, baggage, visa, or availability information.
- Prices and flight facts must come from TripDeal search results, not from you.
- Never promise that a fare is the absolute cheapest or that it will remain available.
- The final booking/payment confirmation must always be performed by the user.
- If a request is outside the current Japan MVP, explain briefly that TripDeal is currently testing Japan first and offer Japan as the available search.

Interpret colloquial Thai naturally. Examples:
- “งบหมื่น”, “หมื่นนึง” => 10000
- “ปลายปี” => if no exact month, keep month empty and ask which month or whether flexible
- “ประมาณ 5 วัน” => 5–7 วัน
- “ไม่ซีเรียสเรื่องบินตรง” => any
- “เอาคุ้มๆ” => best

Return the structured preference values plus a short Thai reply. Empty string means the value is still unknown. budget -1 means unknown; budget 0 means no budget limit.`;

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'country', 'city', 'month', 'days', 'budget', 'direct', 'complete'],
  properties: {
    reply: { type: 'string' },
    country: { type: 'string', enum: ['', 'Japan'] },
    city: { type: 'string', enum: ['', 'Tokyo', 'Osaka', 'Fukuoka', 'Sapporo'] },
    month: { type: 'string', enum: ['', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.', 'ยืดหยุ่น'] },
    days: { type: 'string', enum: ['', '3–4 วัน', '5–7 วัน', '8–10 วัน'] },
    budget: { type: 'integer', minimum: -1, maximum: 1000000 },
    direct: { type: 'string', enum: ['', 'direct', 'any', 'best'] },
    complete: { type: 'boolean' }
  }
};

function outputText(response) {
  for (const item of response?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const part of item?.content ?? []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
    }
  }
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      configured: false,
      error: 'Tripi AI is not configured yet.'
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const message = String(body.message || '').trim();
  const prefs = body.prefs && typeof body.prefs === 'object' ? body.prefs : {};
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

  if (!message) return res.status(400).json({ error: 'message is required' });
  if (message.length > 1200) return res.status(400).json({ error: 'message is too long' });

  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  const input = [
    `Current TripDeal preferences: ${JSON.stringify(prefs)}`,
    history.length ? `Recent conversation: ${JSON.stringify(history)}` : '',
    `Latest user message: ${message}`
  ].filter(Boolean).join('\n\n');

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions: TRIPI_INSTRUCTIONS,
        input,
        store: false,
        max_output_tokens: 450,
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'tripi_preferences',
            strict: true,
            schema
          }
        }
      })
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      console.error('OpenAI error', data?.error?.message || data);
      return res.status(502).json({ error: 'Tripi AI request failed' });
    }

    const text = outputText(data);
    if (!text) return res.status(502).json({ error: 'Tripi AI returned no output' });

    const parsed = JSON.parse(text);
    return res.status(200).json({ configured: true, mode: 'ai', ...parsed });
  } catch (error) {
    console.error('Tripi endpoint error', error);
    return res.status(500).json({ error: 'Tripi AI is temporarily unavailable' });
  }
}
