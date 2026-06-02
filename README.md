# Astro Base

Astro Base - веб-приложение для просмотра и публикации астрофотографий.

В проекте есть интерактивная 3D-сцена Солнечной системы, лента снимков, фильтры по небесным объектам, авторизация, загрузка фото и отдельная админ-панель.

## Возможности

- 3D-визуализация планет и выбор объекта прямо со сцены.
- Лента астрофото с поиском и фильтрами по объектам.
- Регистрация, вход и локальное хранение JWT-токена.
- Загрузка снимков с описанием, телескопом, камерой, координатами и локацией.
- FastAPI backend с PostgreSQL, миграциями Alembic и seed-данными.
- Админ-панель на `/admin`: пользователи, роли, статистика и очистка фото.

## Стек

- Frontend: React, TypeScript, Vite, Three.js, React Three Fiber.
- Backend: FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL.
- Инфраструктура: Docker Compose для локальной PostgreSQL.

## Запуск frontend

```powershell
npm install
npm run dev
```

Frontend откроется на `http://localhost:5173`.

По умолчанию он обращается к API на `http://127.0.0.1:8000`. Если нужен другой адрес:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev
```

## Запуск backend

```powershell
docker compose up -d postgres

cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env

alembic upgrade head
python -m app.seed
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

PostgreSQL из Docker доступна на `localhost:5433`.

## Локальные аккаунты

После `python -m app.seed` создаются тестовые пользователи:

| Роль | Email | Пароль |
| --- | --- | --- |
| Админ | `admin@astrobase.local` | `astro-admin-password` |
| Пользователь | `demo@astrobase.local` | `astro-demo-password` |

Админ-панель доступна по адресу `http://localhost:5173/admin`.

## Команды

```powershell
npm run dev      # frontend dev server
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

Для backend команды выполняются из `apps/api`:

```powershell
alembic upgrade head
python -m app.seed
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Структура

```text
src/              React frontend и 3D-сцена
src/components/   лента, фильтры, авторизация, админка
src/planets/      компоненты небесных объектов
textures/         текстуры планет и звездного фона
apps/api/         FastAPI backend
docker-compose.yml PostgreSQL для локальной разработки
```
