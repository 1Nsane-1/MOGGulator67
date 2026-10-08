// Общие функции для API (файлы с "_" в имени Vercel не делает эндпоинтами)
const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

let _sql, ready;
function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('Не задан DATABASE_URL (подключи Neon в Vercel)');
    _sql = neon(url);
  }
  return _sql;
}

// Создаёт таблицы при первом обращении
async function init() {
  const sql = db();
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, nick TEXT NOT NULL, pass_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now())`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_nick_idx ON users (lower(nick))`;
      await sql`CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), nick TEXT NOT NULL,
        text TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
    })();
    ready.catch(() => { ready = null; });
  }
  await ready;
  return sql;
}

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('Не задан JWT_SECRET');
  return process.env.JWT_SECRET;
}
function getUser(req) {
  const m = /(?:^|;\s*)token=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  try { const p = jwt.verify(m[1], secret()); return { id: p.id, nick: p.nick }; }
  catch (e) { return null; }
}
const sign = (u) => jwt.sign({ id: u.id, nick: u.nick }, secret(), { expiresIn: '30d' });
function setToken(res, token, maxAge) {
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
}
function send(res, code, obj) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).json(obj);
}
module.exports = { init, getUser, sign, setToken, send };
