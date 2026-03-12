# routers/audit.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import models, schemas
from database import get_db
from auth import get_current_user, RoleChecker

router = APIRouter(prefix="/audit", tags=["audit"])

allow_admin = RoleChecker(["admin"])

@router.get("/logs", response_model=List[schemas.AuditLogOut], dependencies=[Depends(allow_admin)])
def get_audit_logs(
    user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(models.AuditLog).options(joinedload(models.AuditLog.user))

    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)

    logs = query.order_by(models.AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else "Система", 
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "timestamp": log.timestamp
        })
    
    return result

@router.get("/stats", dependencies=[Depends(allow_admin)])
def get_audit_stats(db: Session = Depends(get_db)):
    """Краткая статистика действий за всё время"""
    stats = db.query(
        models.AuditLog.action, 
        func.count(models.AuditLog.id)
    ).group_by(models.AuditLog.action).all()
    
    return {action: count for action, count in stats}