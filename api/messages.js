// GET /api/messages?after=<id>   POST /api/messages {text}
const { init, getUser, send } = require('./_db');

module.exports = async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return send(res, 401, { error: 'Нужно войти' });
    const sql = await init();

    if (req.method === 'GET') {
      const after = parseInt(req.query.after) || 0;
      const rows = await sql`SELECT * FROM (
        SELECT id, nick, text, created_at FROM messages WHERE id > ${after} ORDER BY id DESC LIMIT 50
      ) t ORDER BY id`;
      return send(res, 200, { messages: rows });
    }
    if (req.method === 'POST') {
      if (!(req.headers['content-type'] || '').includes('application/json'))
        return send(res, 415, { error: 'Нужен JSON' });
      const text = String((req.body || {}).text || '').trim();
      if (!text || text.length > 500) return send(res, 400, { error: 'Сообщение: от 1 до 500 символов' });
      const [{ n }] = await sql`SELECT count(*)::int AS n FROM messages
        WHERE user_id = ${user.id} AND created_at > now() - interval '10 seconds'`;
      if (n >= 5) return send(res, 429, { error: 'Слишком часто, подожди пару секунд' });
      const [m] = await sql`INSERT INTO messages (user_id, nick, text) VALUES (${user.id}, ${user.nick}, ${text})
        RETURNING id, nick, text, created_at`;
      return send(res, 200, { message: m });
    }
    send(res, 405, { error: 'Метод не поддерживается' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Ошибка сервера: ' + e.message });
  }
};
