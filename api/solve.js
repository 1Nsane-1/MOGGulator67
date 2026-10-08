// POST /api/solve {image?: dataURL(jpeg), text?: string} -> пошаговое решение в LaTeX
const { send } = require('./_db');
const { guard, claude } = require('./_ai');

const SYSTEM = `Ты — преподаватель математики. Пользователь присылает фото задачи и/или текст.
Распознай задачу и реши её подробно, как в приложении Photomath.
Верни ТОЛЬКО JSON без markdown и пояснений вокруг:
{"problem":"<условие в LaTeX>","steps":[{"explain":"<1–2 предложения по-русски, что делаем и почему>","math":"<LaTeX выражения после этого шага>"}],"answer":"<ответ в LaTeX>"}
LaTeX пиши без знаков $. Шагов от 3 до 10. Если на фото нет математики, верни {"error":"<причина по-русски>"}.`;

module.exports = async (req, res) => {
  try {
    if (!(await guard(req, res))) return;
    const { image, text } = req.body || {};
    const content = [];
    if (typeof image === 'string' && image.length && process.env.AI_VISION === '0')
      return send(res, 400, { error: 'Выбранная ИИ-модель не читает фото. Введи условие текстом в поле «Выражение».' });
    if (typeof image === 'string' && image.length) {
      const data = image.replace(/^data:image\/\w+;base64,/, '');
      if (data.length > 3_000_000) return send(res, 413, { error: 'Фото слишком большое' });
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } });
    }
    const t = typeof text === 'string' ? text.trim().slice(0, 500) : '';
    if (!content.length && !t) return send(res, 400, { error: 'Нужны фото или текст задачи' });
    content.push({ type: 'text', text: t ? 'Задача / подсказка: ' + t : 'Реши задачу с фото.' });

    const raw = await claude({ system: SYSTEM, messages: [{ role: 'user', content }], max_tokens: 1800 });
    const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
    let d;
    try { d = JSON.parse(raw.slice(a, b + 1)); } catch (e) { return send(res, 502, { error: 'ИИ вернул ответ не в том формате, попробуй ещё раз' }); }
    if (d.error) return send(res, 422, { error: String(d.error) });
    if (!Array.isArray(d.steps)) return send(res, 502, { error: 'ИИ не вернул шаги решения' });
    send(res, 200, {
      problem: String(d.problem || ''),
      steps: d.steps.slice(0, 15).map((s) => ({ explain: String(s.explain || ''), math: String(s.math || '') })),
      answer: String(d.answer || ''),
    });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Ошибка ИИ: ' + e.message });
  }
};
