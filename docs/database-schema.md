# 🗄️ Схема базы данных

```mermaid
erDiagram
    USERS {
        int id PK
        string username
        string password_hash
    }
    
    IDEAS {
        int id PK
        string title
        text description
        string status
        json attributes
        datetime created_at
        datetime updated_at
        int author_id FK
        int category_id FK
    }
    
    CATEGORIES {
        int id PK
        string name
        string label
        string icon
    }
    
    ATTRIBUTES {
        int id PK
        string name
        string label
        string type
    }
    
    CATEGORY_ATTRIBUTE_LINKS {
        int category_id PK
        int attribute_id PK
    }

    USERS ||--o{ IDEAS : "creates"
    CATEGORIES ||--o{ IDEAS : "contains"
    CATEGORIES ||--o{ CATEGORY_ATTRIBUTE_LINKS : "has"
    ATTRIBUTES ||--o{ CATEGORY_ATTRIBUTE_LINKS : "linked_to"