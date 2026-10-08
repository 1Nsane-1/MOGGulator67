// POST /api/auth?action=register|login|logout   GET /api/auth?action=me
const bcrypt = require('bcryptjs');
const { init, getUser, sign, setToken, send } = require('./_db');
const NICK = /^[A-Za-z0-9_А-Яа-яЁё]{3,20}$/;

module.exports = async (req, res) => {
  try {
    const action = req.query.action;
    if (action === 'me') return send(res, 200, { user: getUser(req) });
    if (req.method !== 'POST') return send(res, 405, { error: 'Только POST' });
    if (!(req.headers['content-type'] || '').includes('application/json'))
      return send(res, 415, { error: 'Нужен JSON' });
    if (action === 'logout') { setToken(res, '', 0); return send(res, 200, { ok: true }); }
    if (action !== 'register' && action !== 'login') return send(res, 400, { error: 'Неизвестное действие' });

    const nick = String((req.body || {}).nick || '').trim();
    const password = String((req.body || {}).password || '');
    if (!NICK.test(nick)) return send(res, 400, { error: 'Ник: 3–20 символов, буквы, цифры и _' });
    if (password.length < 6 || password.length > 72) return send(res, 400, { error: 'Пароль: от 6 до 72 символов' });

    const sql = await init();
    let u;
    if (action === 'register') {
      const hash = await bcrypt.hash(password, 10);
      try {
        [u] = await sql`INSERT INTO users (nick, pass_hash) VALUES (${nick}, ${hash}) RETURNING id, nick`;
      } catch (e) {
        if (e.code === '23505') return send(res, 409, { error: 'Этот ник уже занят' });
        throw e;
      }
    } else {
      [u] = await sql`SELECT id, nick, pass_hash FROM users WHERE lower(nick) = lower(${nick})`;
      if (!u || !(await bcrypt.compare(password, u.pass_hash)))
        return send(res, 401, { error: 'Неверный ник или пароль' });
    }
    setToken(res, sign(u), 60 * 60 * 24 * 30);
    send(res, 200, { user: { id: u.id, nick: u.nick } });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Ошибка сервера: ' + e.message });
  }
};
