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

# --- Идеи ---
class IdeaCreate(BaseModel):
    title: str
    description: Optional[str] = None
    idea_type: str
    attributes: Dict[str, Any]

class IdeaOut(IdeaCreate):
    id: int
    author_id: int
    status: str
    class Config:
        from_attributes = True

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None

class StatusUpdate(BaseModel):
    status: str # new, planned, done, rejected