from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from sqlalchemy import or_

import models, schemas
from database import get_db
from auth import get_current_user
from auth import allow_moderator
from utils import log_event

router = APIRouter(
    prefix="/ideas",
    tags=["ideas"]
)

router = APIRouter(prefix="/ideas", tags=["ideas"])

def get_idea_permissions(idea: models.Idea, user: models.User) -> dict:
    is_author = idea.author_id == user.id
    is_admin = user.role == "admin"
    is_mod = user.role == "moderator"
    
    return {
        "can_edit": is_author or is_admin or is_mod,
        "can_delete": is_author or is_admin,
        "can_share": is_author,
        "can_change_status": is_author or is_admin or is_mod
    }


@router.post("/", response_model=schemas.IdeaOut, status_code=status.HTTP_201_CREATED)
def create_idea(
    idea: schemas.IdeaCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if hasattr(current_user, "is_active") and not current_user.is_active:
        raise HTTPException(status_code=403, detail="Ваш аккаунт заблокирован")

    category = db.query(models.Category).filter(models.Category.id == idea.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Категория не найдена")

    db_idea = models.Idea(
        title=idea.title,
        description=idea.description,
        category_id=idea.category_id,
        attributes=idea.attributes,
        author_id=current_user.id 
    )

    try:
        db.add(db_idea)
        db.flush() 

        log_event(
            db,
            user_id=current_user.id,
            action="CREATE",
            res_type="idea",
            res_id=db_idea.id,
            details={"title": db_idea.title, "category": category.label}
        )

        db.commit()
        db.refresh(db_idea)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Ошибка при сохранении идеи")

    return db_idea


@router.get("/", response_model=List[schemas.IdeaShort])
def get_ideas(
    category_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Idea).options(joinedload(models.Idea.author))
    
    if current_user.role not in ["admin", "moderator"]:
        query = query.filter(
            or_(
                models.Idea.author_id == current_user.id,
                models.Idea.shared_with.any(models.User.id == current_user.id)
            )
        )
    
    if category_id:
        query = query.filter(models.Idea.category_id == category_id)
    
    ideas = query.order_by(models.Idea.created_at.desc()).limit(limit).all()
    
    for idea in ideas:
        idea.permissions = get_idea_permissions(idea, current_user)
        
    return ideas

@router.get("/{idea_id}", response_model=schemas.IdeaOut)
def get_idea(
    idea_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_idea = db.query(models.Idea).options(
        joinedload(models.Idea.author),
        joinedload(models.Idea.category_ref)
    ).filter(models.Idea.id == idea_id).first()
    
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    is_admin = current_user.role in ["admin", "moderator"]
    is_author = db_idea.author_id == current_user.id
    is_shared = any(u.id == current_user.id for u in db_idea.shared_with)
    
    if not (is_admin or is_author or is_shared):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
        
    db_idea.permissions = get_idea_permissions(db_idea, current_user)
    
    return db_idea

@router.put("/{idea_id}", response_model=schemas.IdeaOut)
def update_idea(
    idea_id: int, 
    idea_update: schemas.IdeaUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    is_author = db_idea.author_id == current_user.id
    is_privileged = current_user.role in ["admin", "moderator"]
    
    if not (is_author or is_privileged):
        logger.warning(f"User {current_user.username} tried to edit idea {idea_id} without permissions")
        raise HTTPException(
            status_code=403, 
            detail="У вас нет прав на редактирование этой идеи"
        )

    update_data = idea_update.dict(exclude_unset=True)
    changed_fields = list(update_data.keys())

    for key, value in update_data.items():
        if key == "author_id":
            continue
        setattr(db_idea, key, value)
    
    log_event(
        db, 
        user_id=current_user.id, 
        action="UPDATE", 
        res_type="idea", 
        res_id=idea_id, 
        details={"fields": changed_fields}
    )
    
    try:
        db.commit()
        db.refresh(db_idea)
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating idea {idea_id}: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при обновлении данных")
        
    return db_idea

@router.patch("/{idea_id}/status", response_model=schemas.IdeaOut)
def update_status(
    idea_id: int, 
    status_data: schemas.StatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    is_author = db_idea.author_id == current_user.id
    is_privileged = current_user.role in ["admin", "moderator"]
    
    if not (is_author or is_privileged):
        logger.warning(f"User {current_user.username} denied status change for idea {idea_id}")
        raise HTTPException(
            status_code=403, 
            detail="У вас нет прав на изменение статуса этой идеи"
        )

    if db_idea.status == "rejected" and status_data.status != "rejected" and current_user.role != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Только администратор может восстановить отклоненную идею"
        )

    old_status = db_idea.status
    new_status = status_data.status

    db_idea.status = new_status
    
    log_event(
        db, 
        user_id=current_user.id, 
        action="STATUS_CHANGE", 
        res_type="idea", 
        res_id=idea_id, 
        details={
            "from": old_status, 
            "to": new_status,
            "title": db_idea.title
        }
    )
    
    try:
        db.commit()
        db.refresh(db_idea)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to patch status for idea {idea_id}: {e}")
        raise HTTPException(status_code=500, detail="Ошибка базы данных")
        
    return db_idea

@router.delete("/{idea_id}")
def delete_idea(
    idea_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    can_delete = (db_idea.author_id == current_user.id) or (current_user.role == "admin")
    
    if not can_delete:
        raise HTTPException(
            status_code=403, 
            detail="Удалить идею может только автор или администратор"
        )
    
    log_event(db, current_user.id, "DELETE", "idea", idea_id, {"title": db_idea.title})
    
    db.delete(db_idea)
    db.commit()
    return {"detail": "Идея успешно удалена"}

@router.post("/{idea_id}/share/{target_user_id}")
def share_idea(
    idea_id: int, 
    target_user_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    
    if idea.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете делиться чужой идеей")
    
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    if target_user not in idea.shared_with:
        idea.shared_with.append(target_user)
        db.commit()
        
    return {"message": f"Доступ к идее выдан пользователю {target_user.username}"}