# MOGGулятор67

Запуск в VS Code:

1. Открой папку проекта (File → Open Folder).
2. Установи расширение **Live Server**, ПКМ по `index.html` → _Open with Live Server_.
   Либо в терминале: `npx serve .` и открой адрес из консоли.
3. Нужен интернет: Tesseract.js при первом запуске скачивает данные языка (~10 МБ).

Файлы: `index.html` (разметка), `style.css` (стили), `app.js` (парсер, пошаговое решение, OCR, вкладки, ачивки).
OCR читает печатный текст в строку. Дроби «в два этажа» и переменные (n, m) не поддерживаются.

## Сервер (Vercel)

- `api/weather.js` — погода (Open-Meteo, ключ не нужен).
- `api/auth.js`, `api/messages.js` — аккаунты (ник + пароль, bcrypt, JWT в cookie) и общий чат (опрос раз в 3 с).
- Переменные окружения: `DATABASE_URL` (Neon Postgres через Vercel Storage), `JWT_SECRET` (случайная строка).
- Локально: `npm install`, затем `npx vercel dev`.

## ИИ (Claude)

- `api/assistant.js` — чат-ассистент, `api/solve.js` — решение по фото/тексту в стиле Photomath. Оба требуют вход через «Чат».
- Переменные: `ANTHROPIC_API_KEY` (обязательно), `ANTHROPIC_MODEL` (необязательно, по умолчанию `claude-sonnet-5-5`).
- Лимит: 30 запросов к ИИ в час на пользователя (`LIMIT_PER_HOUR` в `api/_ai.js`). `vercel.json` увеличивает таймаут этих функций до 60 с.
  Сайт: https://moggulator67.vercel.app
