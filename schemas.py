from pydantic import BaseModel
from typing import Optional, Any, Dict, List

# --- Пользователи ---
class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

# --- Токены ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# --- Категории ---
class AttributeOut(BaseModel):
    id: int
    name: str
    label: str
    type: str
    class Config:
        from_attributes = True

class CategoryOut(BaseModel):
    id: int
    name: str
    label: str
    icon: str
    linked_attributes: List[AttributeOut] = [] 
    class Config:
        from_attributes = True

# --- Идеи ---
class IdeaCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: int
    attributes: Dict[str, Any]

class IdeaOut(IdeaCreate):
    id: int
    title: str
    description: Optional[str]
    status: str
    attributes: Dict[str, Any]
    author_id: int
    category_ref: CategoryOut
    class Config:
        from_attributes = True

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int]
    attributes: Optional[Dict[str, Any]] = None

class StatusUpdate(BaseModel):
    status: str # new, planned, done, rejected

class IdeaShort(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    category_id: int
    attributes: Dict[str, Any]
    
    class Config:
        from_attributes = True

# --- Фильтры ---
class FilterOption(BaseModel):
    name: str   # техническое имя: 'director'
    label: str  # красивое имя: 'Режиссер'
    type: str   # 'string', 'number', 'boolean', 'date'
    values: List[str] # уникальные значения, которые уже есть в базе

class CategoryFilterConfig(BaseModel):
    category_id: int
    category_label: str
    dynamic_filters: List[FilterOption]
    common_filters: List[Dict[str, Any]]
