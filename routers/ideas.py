from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/ideas",
    tags=["ideas"]
)

@router.post("/", response_model=schemas.IdeaOut)
def create_idea(idea: schemas.IdeaCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    
    # Проверяем, существует ли такая категория вообще
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
    db.add(db_idea)
    db.commit()
    db.refresh(db_idea)
    return db_idea

@router.get("/", response_model=List[schemas.IdeaShort])
def get_ideas(
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Idea)
    if category_id:
        query = query.filter(models.Idea.category_id == category_id)
    return query.all()

@router.get("/{idea_id}", response_model=schemas.IdeaOut)
def get_idea(idea_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    return db_idea

@router.put("/{idea_id}", response_model=schemas.IdeaOut)
def update_idea(idea_id: int, idea_update: schemas.IdeaUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    update_data = idea_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_idea, key, value)
    
    db.commit()
    db.refresh(db_idea)
    return db_idea

@router.patch("/{idea_id}/status", response_model=schemas.IdeaOut)
def update_status(idea_id: int, status_data: schemas.StatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    db_idea.status = status_data.status
    db.commit()
    db.refresh(db_idea)
    return db_idea

@router.delete("/{idea_id}")
def delete_idea(idea_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    db.delete(db_idea)
    db.commit()
    return {"detail": "Идея успешно удалена"}
