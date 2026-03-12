from sqlalchemy.orm import Session
import models

def log_event(db: Session, user_id: int, action: str, res_type: str, res_id: int = None, details: dict = None):
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        resource_type=res_type,
        resource_id=res_id,
        details=details
    )
    db.add(log)
    db.commit() 