from sqlalchemy import Table, Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

idea_access_association = Table(
    "idea_access",
    Base.metadata,
    Column("idea_id", Integer, ForeignKey("ideas.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)

# Пользователи (логин/пароль- авторизация)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    my_ideas = relationship("Idea", back_populates="author")
    shared_ideas = relationship("Idea", secondary=idea_access_association, back_populates="shared_with")

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User")
    action = Column(String)  
    resource_type = Column(String) 
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True) 
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# Идеи
class Idea(Base):
    __tablename__ = "ideas"
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", back_populates="my_ideas") 
    title = Column(String, index=True)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category_ref = relationship("Category", back_populates="ideas")
    status = Column(String, default="new", index=True)
    attributes = Column(JSON) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    shared_with = relationship("User", secondary=idea_access_association, back_populates="shared_ideas")

# Таблица связи категория-атрибут    
category_attribute_association = Table(
    "category_attribute_links",
    Base.metadata,
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
    Column("attribute_id", Integer, ForeignKey("attributes.id"), primary_key=True),
)

# Категории идей
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    label = Column(String)           
    icon = Column(String)            
    linked_attributes = relationship("Attribute", secondary=category_attribute_association, back_populates="categories")
    ideas = relationship("Idea", back_populates="category_ref")

# Атрибуты категорий
class Attribute(Base):
    __tablename__ = "attributes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    label = Column(String)          
    type = Column(String)            
    categories = relationship("Category", secondary=category_attribute_association, back_populates="linked_attributes")
