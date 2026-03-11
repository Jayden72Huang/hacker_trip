/**
 * 统一 LLM 调用：DeepSeek (优先) → Google Gemini (fallback)
 */

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMOptions {
  messages: LLMMessage[];
  maxTokens?: number;
}

async function callDeepSeek(messages: LLMMessage[], maxTokens: number): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('NO_KEY');

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(messages: LLMMessage[], maxTokens: number): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('NO_KEY');

  // Convert messages to Gemini format
  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
  const userMsg = messages.find((m) => m.role === 'user')?.content || '';

  const prompt = systemMsg ? `${systemMsg}\n\n---\n\n${userMsg}` : userMsg;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function chatCompletion(options: LLMOptions): Promise<string> {
  const { messages, maxTokens = 4096 } = options;

  // 1. Try DeepSeek
  try {
    const result = await callDeepSeek(messages, maxTokens);
    if (result) return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg !== 'NO_KEY') {
      console.error('DeepSeek failed, trying Gemini fallback:', msg);
    }
  }

  // 2. Fallback to Gemini
  try {
    const result = await callGemini(messages, maxTokens);
    if (result) return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg !== 'NO_KEY') {
      console.error('Gemini also failed:', msg);
    }
  }

  throw new Error('AI 服务不可用，请检查 DEEPSEEK_API_KEY 或 GOOGLE_API_KEY 配置');
}
