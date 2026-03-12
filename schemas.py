from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, Dict, List

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    username: Optional[str]  
    action: str
    resource_type: str
    resource_id: Optional[int]
    details: Optional[Dict[str, Any]]
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Пользователи ---
class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str # admin, moderator, user

class UserSearch(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class UserStatusUpdate(BaseModel):
    is_active: bool

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

class IdeaPermissions(BaseModel):
    can_edit: bool
    can_delete: bool
    can_share: bool
    can_change_status: bool

class IdeaShort(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    category_id: int
    attributes: Dict[str, Any]
    created_at: datetime
    author: UserOut
    permissions: IdeaPermissions
    
    class Config:
        from_attributes = True

# --- Фильтры ---
class FilterOption(BaseModel):
    name: str   
    label: str  
    type: str   
    values: List[Any]

class CategoryFilterConfig(BaseModel):
    category_id: int
    category_label: str
    dynamic_filters: List[FilterOption]
    common_filters: List[Dict[str, Any]]
