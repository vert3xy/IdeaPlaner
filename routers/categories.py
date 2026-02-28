from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional

import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(
    prefix="/categories",
    tags=["categories"]
)

@router.get("", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).options(joinedload(models.Category.linked_attributes)).all()

@router.get("/{cat_id}/filters", response_model=schemas.CategoryFilterConfig)
def get_category_filters(cat_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).options(
        joinedload(models.Category.linked_attributes)
    ).filter(models.Category.id == cat_id).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    dynamic_filters = []

    for attr in category.linked_attributes:
        query = db.query(
            func.json_extract(models.Idea.attributes, f'$.{attr.name}').label("val")
        ).filter(models.Idea.category_id == cat_id).distinct()
        
        values = [row.val for row in query.all() if row.val]

        dynamic_filters.append({
            "name": attr.name,
            "label": attr.label,
            "type": attr.type,
            "values": values
        })

    return {
        "category_id": category.id,
        "category_label": category.label,
        "dynamic_filters": dynamic_filters,
        "common_filters": [
            {"name": "status", "label": "Статус", "type": "select", "values": ["new", "planned", "done", "rejected"]},
            {"name": "created_at", "label": "Дата добавления", "type": "date"}
        ]
    }