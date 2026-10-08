// GET /api/sync -> {data}   POST /api/sync {data:{h,n,s}}  — история, заметки и ачивки в аккаунте
const { init, getUser, send } = require('./_db');

module.exports = async (req, res) => {
  try {
    const u = getUser(req);
    if (!u) return send(res, 401, { error: 'Нужно войти' });
    const sql = await init();
    if (req.method === 'GET') {
      const [r] = await sql`SELECT data FROM user_data WHERE user_id = ${u.id}`;
      return send(res, 200, { data: r ? r.data : null });
    }
    if (req.method === 'POST') {
      if (!(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Нужен JSON' });
      const data = (req.body || {}).data;
      if (!data || typeof data !== 'object') return send(res, 400, { error: 'Нет данных' });
      const str = JSON.stringify(data);
      if (str.length > 100000) return send(res, 413, { error: 'Слишком много данных' });
      await sql`INSERT INTO user_data (user_id, data) VALUES (${u.id}, ${str}::jsonb)
        ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
      return send(res, 200, { ok: true });
    }
    send(res, 405, { error: 'Метод не поддерживается' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Ошибка сервера: ' + e.message });
  }
};
