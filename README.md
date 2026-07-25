# Astro Base

Astro Base - приложение с интерактивной 3D-сценой Солнечной системы и лентой астрофотографий.
Demo site - https://feg55.github.io/Astro-Base/

<img width="1280" height="720" alt="Timeline2_readme_hq" src="https://github.com/user-attachments/assets/59f16d65-defc-4b1c-8890-77b8e9bbfa64" />

## Структура

```text
frontend/                 React, TypeScript, Vite и статические текстуры
backend/                  FastAPI, SQLAlchemy и Alembic
docker-compose.yml        PostgreSQL для локальной разработки
.github/workflows/        публикация frontend на GitHub Pages
```

## Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Приложение откроется на `http://localhost:5173` и по умолчанию будет обращаться к API на `http://127.0.0.1:8000`.

Для запуска без backend, с локальными демо-данными:

```powershell
$env:VITE_DEMO_MODE="true"
npm run dev
```

Другой адрес API можно передать через `VITE_API_URL`:

```powershell
$env:VITE_API_URL="https://api.example.com"
npm run dev
```

Проверки frontend:

```powershell
npm run lint
npm run build
npm run preview
```

## Backend

PostgreSQL запускается из корня проекта:

```powershell
docker compose up -d postgres
```

Затем запустите API:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
alembic upgrade head
python -m app.seed
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

PostgreSQL доступен на `localhost:5433`, API - на `http://127.0.0.1:8000`.

После `python -m app.seed` создаются тестовые аккаунты:

| Роль | Email | Пароль |
| --- | --- | --- |
| Админ | `admin@astrobase.local` | `astro-admin-password` |
| Пользователь | `demo@astrobase.local` | `astro-demo-password` |

## Демо на GitHub Pages

<img width="1280" height="720" alt="Timeline1_readme_hq" src="https://github.com/user-attachments/assets/ff581370-ef37-42d8-8e3a-61ffb1565ea9" />

Workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) уже собирает содержимое `frontend/` и публикует его при push в `main`.

На бесплатном аккаунте репозиторий должен быть публичным, чтобы использовать GitHub Pages.

1. Откройте репозиторий → `Settings` → `Pages`.
2. В `Build and deployment` выберите `Source: GitHub Actions`.
3. Закоммитьте изменения и отправьте их в GitHub.
4. Дождитесь завершения workflow `Deploy frontend to GitHub Pages` во вкладке `Actions`.

Адрес демо: `https://feg55.github.io/Astro-Base/`.

Без дополнительных настроек Pages запускается в статическом demo mode: лента, поиск, фильтры и 3D-сцена работают на локальных данных; авторизация, загрузка фото и админка отключены.

GitHub Pages не запускает FastAPI и PostgreSQL. Для полноценного режима разместите backend отдельно по HTTPS, затем:

1. В GitHub откройте `Settings` → `Secrets and variables` → `Actions` → `Variables`.
2. Создайте repository variable `VITE_API_URL` с публичным HTTPS-адресом API.
3. Добавьте `https://feg55.github.io` в `CORS_ORIGINS` backend.
4. Перезапустите workflow Pages.
