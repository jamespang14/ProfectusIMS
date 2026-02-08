from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core import security, crud
from ..dependencies import get_db, get_current_active_user
from ..schemas import user as schemas
from ..schemas import audit as audit_schemas
from ..db import models

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = security.get_password_hash(user.password)
    print(hashed_password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

from ..schemas.common import PaginatedResponse
import math

@router.get("/", response_model=PaginatedResponse[schemas.User])
def read_users(
    page: int = 1, 
    size: int = 20, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    skip = (page - 1) * size
    total = db.query(models.User).count()
    users = db.query(models.User).offset(skip).limit(limit=size).all()
    return {
        "items": users,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if size > 0 else 0
    }

@router.patch("/{user_id}/role", response_model=schemas.User)
def update_user_role(
    user_id: int, 
    role_update: schemas.UserRoleUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    
    audit_log = audit_schemas.AuditLogCreate(
        action="UPDATE_ROLE",
        entity_type="USER",
        entity_id=user.id,
        user_id=current_user.id,
        details=f"Updated role to {role_update.role}"
    )
    crud.create_audit_log(db, audit_log)
    
    return user

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    

    audit_log = audit_schemas.AuditLogCreate(
        action="DELETE",
        entity_type="USER",
        entity_id=user_id,
        user_id=current_user.id,
        details="Deleted user"
    )
    crud.create_audit_log(db, audit_log)
    
    return None
