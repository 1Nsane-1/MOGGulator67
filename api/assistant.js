// POST /api/assistant {messages:[{role:'user'|'assistant', content:'...'}]}
const { send } = require('./_db');
const { guard, claude } = require('./_ai');

const SYSTEM = `Ты — ИИ-ассистент приложения MOGGулятор67, помогаешь школьникам и студентам с математикой и учёбой.
Отвечай по-русски, дружелюбно, кратко и по шагам. Формулы пиши в LaTeX: короткие между $...$, крупные между $$...$$.
Если вопрос не про учёбу — ответь коротко и мягко предложи вернуться к задачам.`;

module.exports = async (req, res) => {
  try {
    if (!(await guard(req, res))) return;
    let msgs = Array.isArray((req.body || {}).messages) ? req.body.messages : [];
    msgs = msgs
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return send(res, 400, { error: 'Пустой вопрос' });
    const reply = await claude({ system: SYSTEM, messages: msgs, max_tokens: 800 });
    send(res, 200, { reply });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Ошибка ИИ: ' + e.message });
  }
};
