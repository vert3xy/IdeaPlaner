from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from auth import get_current_user, RoleChecker

router = APIRouter(prefix="/users", tags=["users"])

allow_admin = RoleChecker(["admin"])

@router.get("/", response_model=List[schemas.UserOut], dependencies=[Depends(allow_admin)])
def get_all_users(db: Session = Depends(get_db)):
    """Список всех пользователей (только для Админа)"""
    return db.query(models.User).all()

@router.patch("/{user_id}/status", response_model=schemas.UserOut, dependencies=[Depends(allow_admin)])
def update_user_status(
    user_id: int, 
    status_data: schemas.UserStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Активация/Деактивация пользователя (только Админ)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя деактивировать собственный аккаунт")

    user.is_active = status_data.is_active
    
    action_type = "ACTIVATE" if user.is_active else "DEACTIVATE"
    log_event(db, current_user.id, action_type, "user", user.id, {"username": user.username})
    
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/role", response_model=schemas.UserOut, dependencies=[Depends(allow_admin)])
def update_user_role(
    user_id: int, 
    role_data: schemas.UserRoleUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Смена роли пользователя (только для Админа)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.id == current_user.id and role_data.role != "admin":
        raise HTTPException(status_code=400, detail="Вы не можете снять с себя роль админа")

    old_role = user.role
    user.role = role_data.role
    
  
    db.commit()
    db.refresh(user)
    return user

@router.get("/search", response_model=List[schemas.UserSearch])
def search_users(
    query: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Поиск пользователей по имени (для функции 'Поделиться')"""
    if len(query) < 2:
        return []
    
    users = db.query(models.User).filter(
        models.User.username.ilike(f"%{query}%"),
        models.User.id != current_user.id 
    ).limit(10).all()
    
    return users