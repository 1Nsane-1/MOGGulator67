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
  Ссылка https://moggulator67.vercel.app
