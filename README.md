# CVision

Веб-приложение для анализа резюме, уточнения опыта, создания HTML-резюме и ссылки для работодателя.

## Запуск после клонирования

Нужны Git и Node.js **20.19+**.

```powershell
git clone https://github.com/Bratanau/resume_generator.git
cd resume_generator
npm install
Copy-Item .env.example .env
npm run dev
```

Откройте **http://localhost:3000**.

Для генерации вопросов и резюме через Gemini добавьте свой `GEMINI_API_KEY` в `.env`. Без ключа приложение использует локальный резервный анализатор; при исчерпанной квоте Gemini также включается резервный режим.

## Проверки и сборка

```powershell
npm run lint
npm run build
```

Не добавляйте `.env` в Git: он содержит секретный API-ключ.
