# MOGGулятор67

Запуск в VS Code:
1. Открой папку проекта (File → Open Folder).
2. Установи расширение **Live Server**, ПКМ по `index.html` → *Open with Live Server*.
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

### Другие нейросети (бесплатные/дешёвые)
Задай `AI_PROVIDER=openai`, `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` (и `AI_VISION=0`, если модель не читает фото):
- **Gemini** (есть бесплатный тариф, читает фото): `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`, модель из Google AI Studio (например `gemini-2.5-flash`).
- **DeepSeek** (дёшево, без фото): `AI_BASE_URL=https://api.deepseek.com`, `AI_MODEL=deepseek-chat`, `AI_VISION=0`.
- **OpenRouter** (есть бесплатные модели с суффиксом `:free`): `AI_BASE_URL=https://openrouter.ai/api/v1`.
- **Groq**: `AI_BASE_URL=https://api.groq.com/openai/v1`.

## Остальные функции
- `api/maps.js` — поиск адресов (Nominatim) и маршруты (OSRM); карта Leaflet + OpenStreetMap.
- `api/radio.js` — каталог радиостанций Radio Browser (по умолчанию «шансон»).
- `api/sync.js` — облачное сохранение истории, заметок и ачивок в аккаунте (таблица `user_data` создаётся сама).
- Шахматы: правила — chess.js, соперник — простой минимакс. Донаты: ссылка DonationAlerts в шапке.
- PWA: `manifest.webmanifest`, `sw.js`, иконки `icon-192.png` / `icon-512.png`.
