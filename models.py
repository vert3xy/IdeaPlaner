from sqlalchemy import Table, Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from database import Base
import datetime

# Пользователи (логин/пароль- авторизация)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

# Идеи
class Idea(Base):
    __tablename__ = "ideas"
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category_ref = relationship("Category", back_populates="ideas")
    status = Column(String, default="new", index=True)
    attributes = Column(JSON) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

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
