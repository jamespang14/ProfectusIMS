from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..dependencies import get_db, get_current_user
from ..db import models
from ..schemas import alerts as schemas
from ..core import crud

router = APIRouter()

@router.get("/", response_model=List[schemas.AlertWithDetails])
def read_alerts(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # if current_user.role not in [models.Role.ADMIN, models.Role.MANAGER]:
    #     raise HTTPException(status_code=403, detail="Not authorized")
    
    db_alerts = crud.get_alerts(db, skip=skip, limit=limit, status=status)
    
    # Enhance alerts with details
    results = []
    for alert in db_alerts:
        item_title = None
        if alert.item_id:
            item = crud.get_item(db, alert.item_id)
            item_title = item.title if item else "Unknown Item"
        
        created_by_email = None
        if alert.created_by:
            user = db.query(models.User).filter(models.User.id == alert.created_by).first()
            created_by_email = user.email if user else None
            
        resolved_by_email = None
        if alert.resolved_by:
            user = db.query(models.User).filter(models.User.id == alert.resolved_by).first()
            resolved_by_email = user.email if user else None
            
        results.append(schemas.AlertWithDetails(
            **alert.__dict__,
            item_title=item_title,
            created_by_email=created_by_email,
            resolved_by_email=resolved_by_email
        ))
    
    return results

@router.post("/", response_model=schemas.Alert)
def create_manual_alert(
    alert: schemas.AlertCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.Role.ADMIN, models.Role.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return crud.create_alert(db, alert, created_by=current_user.id)

@router.patch("/{alert_id}/resolve", response_model=schemas.Alert)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.Role.ADMIN, models.Role.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_alert = crud.resolve_alert(db, alert_id, current_user.id)
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return db_alert

@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete alerts")
    
    success = crud.delete_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"detail": "Alert deleted"}
