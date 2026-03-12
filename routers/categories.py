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
def get_category_filters(cat_id: str, db: Session = Depends(get_db)):
    if cat_id == "all":
        return {
            "category_id": 0,
            "category_label": "Все",
            "dynamic_filters": [],
            "common_filters": [
                {"name": "status", "label": "Статус", "type": "select", "values": ["new", "planned", "done", "rejected"]},
                {"name": "created_at", "label": "Дата добавления", "type": "date"},
                {"name": "author", "label": "Автор", "type": "select", "values": ["admin"]} # Добавили автора
            ]
        }

    try:
        category_int_id = int(cat_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category ID")

    category = db.query(models.Category).options(
        joinedload(models.Category.linked_attributes)
    ).filter(models.Category.id == category_int_id).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    dynamic_filters = []
    for attr in category.linked_attributes:
        query = db.query(
            func.json_extract(models.Idea.attributes, f'$.{attr.name}').label("val")
        ).filter(models.Idea.category_id == category_int_id).distinct()
        
        values = [str(row.val) for row in query.all() if row.val is not None]
        values = list(set(values))

        dynamic_filters.append({
            "name": attr.name, "label": attr.label, "type": attr.type, "values": values
        })

    return {
        "category_id": category.id,
        "category_label": category.label,
        "dynamic_filters": dynamic_filters,
        "common_filters": [
            {"name": "status", "label": "Статус", "type": "select", "values": ["new", "planned", "done", "rejected"]},
            {"name": "created_at", "label": "Дата добавления", "type": "date"},
            {"name": "author", "label": "Автор", "type": "select", "values": ["admin"]}
        ]
    }