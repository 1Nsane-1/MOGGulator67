// Общие функции для обращения к Claude: проверка входа, лимиты, запрос к API
const { init, getUser, send } = require('./_db');
const LIMIT_PER_HOUR = 30; // запросов к ИИ на одного пользователя
// AI_PROVIDER: 'anthropic' (по умолчанию) или 'openai' — любой OpenAI-совместимый API (DeepSeek, Gemini, Groq, OpenRouter...)
const PROVIDER = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();

// Возвращает пользователя или null (ответ об ошибке уже отправлен)
async function guard(req, res) {
  if (req.method !== 'POST') { send(res, 405, { error: 'Только POST' }); return null; }
  if (!(req.headers['content-type'] || '').includes('application/json')) { send(res, 415, { error: 'Нужен JSON' }); return null; }
  const user = getUser(req);
  if (!user) { send(res, 401, { error: 'Войди в аккаунт во вкладке «Чат»' }); return null; }
  const keyName = PROVIDER === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'AI_API_KEY';
  if (!process.env[keyName]) { send(res, 500, { error: 'Не задан ' + keyName }); return null; }
  const sql = await init();
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM ai_log
    WHERE user_id = ${user.id} AND created_at > now() - interval '1 hour'`;
  if (n >= LIMIT_PER_HOUR) { send(res, 429, { error: `Лимит ИИ: ${LIMIT_PER_HOUR} запросов в час. Попробуй позже.` }); return null; }
  await sql`INSERT INTO ai_log (user_id) VALUES (${user.id})`;
  return user;
}

async function claude({ system, messages, max_tokens }) {
  if (PROVIDER === 'anthropic') return callAnthropic({ system, messages, max_tokens });
  return callOpenAI({ system, messages, max_tokens });
}

async function callAnthropic({ system, messages, max_tokens }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens, system, messages }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d.error && d.error.message) || 'Claude API ' + r.status);
  return (d.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

// Формат OpenAI /chat/completions (его понимают DeepSeek, Gemini, Groq, OpenRouter и др.)
async function callOpenAI({ system, messages, max_tokens }) {
  const base = (process.env.AI_BASE_URL || '').replace(/\/+$/, '');
  if (!base || !process.env.AI_MODEL) throw new Error('Не заданы AI_BASE_URL и AI_MODEL');
  const conv = messages.map((m) => ({
    role: m.role,
    content: Array.isArray(m.content)
      ? m.content.map((b) => b.type === 'image'
          ? { type: 'image_url', image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } }
          : { type: 'text', text: b.text })
      : m.content,
  }));
  const r = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.AI_API_KEY },
    body: JSON.stringify({ model: process.env.AI_MODEL, max_tokens, messages: [{ role: 'system', content: system }, ...conv] }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d.error && (d.error.message || d.error)) || 'AI API ' + r.status);
  return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
}
module.exports = { guard, claude };
