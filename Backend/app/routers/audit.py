from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core import crud
from ..schemas import audit as schemas
from ..dependencies import get_db, get_current_active_user
from ..db import models

router = APIRouter()

@router.get("/", response_model=List[schemas.AuditLog])
def read_audit_logs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
    return crud.get_audit_logs(db, skip=skip, limit=limit)

@router.get("/user/{user_id}", response_model=List[schemas.AuditLog])
def read_audit_logs_by_user(
    user_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
    return crud.get_audit_logs_by_user(db, user_id=user_id, skip=skip, limit=limit)

@router.get("/item/{item_id}", response_model=List[schemas.AuditLog])
def read_audit_logs_by_item(
    item_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
    return crud.get_audit_logs_by_item(db, item_id=item_id, skip=skip, limit=limit)
