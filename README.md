# Проект "IdeaPlaner" (рабочее название)

## Цель
Приватное приложение для структурирования совместного досуга.

## Стек
- Backend: Python (FastAPI)
- Database: SQLite + JSON1
- Frontend: HTML + Tailwind CSS
- Server: Ubuntu 24.04 (Beget VPS)

## API Specification (CRUD)

### Ideas
- `GET /api/v1/ideas` — Получить список идей
- `GET /api/v1/ideas/{id}` — Детальная карточка идеи
- `POST /api/v1/ideas` — Создать новую идею
- `PUT /api/v1/ideas/{id}` — Полное редактирование данных
- `PATCH /api/v1/ideas/{id}/status` — Смена статуса
- `DELETE /api/v1/ideas/{id}` — Удаление

### Auth
- `POST /api/v1/auth/signup` — Регистрация (только по секретному коду приглашения)
- `POST /api/v1/auth/login` — Логин (выдача JWT токена)

## База данных (Categories & Attributes)
1. **Кино** {director: str, year: int, kinopoisk_url: str}
2. **Игры** {platform: enum, genre: str, steam_url: str}
3. **Рестораны** {address: str, cuisine: str, avg_check: int}
4. **Путешествия** {city: str, season: str, budget_range: str}
5. **Мероприятия** {date: datetime, price: int, ticket_url: str}
