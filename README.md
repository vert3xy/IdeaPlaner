# 💡 Idea Planner App

Веб-приложение для фиксации, категоризации и управления идеями. Проект демонстрирует навыки проектирования гибкой архитектуры баз данных и разработки RESTful API.

## 🛠 Стек технологий
* **Backend:** Python 3, FastAPI, Pydantic, SQLAlchemy.
* **Database:** SQLite (для легкости развертывания).
* **Frontend:** HTML/CSS, Vanilla JavaScript (Jinja2 Templates).
* **Инфраструктура:** Docker, Docker Compose.

## 📚 Проектная документация

Документация оформлена по стандартам системного анализа и находится в директории [`/docs`](./docs):

| Артефакт | Описание |
| :--- | :--- |
| 🗄️ **[Архитектура БД (ER-диаграмма)](./docs/database-schema.md)** | Описание таблиц, связей и реализации хранения динамических атрибутов. |
| 👤 **[Use Cases (Пользовательские сценарии)](./docs/use-cases.md)** | Бизнес-логика, Happy Path и альтернативные сценарии работы системы. |
| 🔌 **[Спецификация API](./docs/api-spec.md)** | Описание сложных эндпоинтов (например, генерация динамических фильтров). |

---

<details>
<summary><b>Посмотреть структуру проекта (нажми, чтобы развернуть)</b></summary>

```text
├── main.py                 # Точка входа FastAPI
├── models.py               # SQLAlchemy модели базы данных
├── schemas.py              # Pydantic модели (DTO)
├── routers/                # API эндпоинты (ideas, categories, auth)
├── static/                 # Frontend: Vanilla JS & CSS
├── templates/              # Jinja2 HTML шаблоны
└── docs/                   # Аналитическая документация