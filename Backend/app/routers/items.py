from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core import crud
from ..schemas import item as schemas
from ..schemas import audit as audit_schemas
from ..dependencies import get_db, get_current_active_user
from ..db import models

router = APIRouter()

@router.post("/", response_model=schemas.Item)
def create_item(
    item: schemas.ItemCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not enough permissions"
        )
    # item.owner_id = current_user.id # If we want to force ownership
    db_item = crud.create_item(db=db, item=item)
    
    # Log the action
    audit_log = audit_schemas.AuditLogCreate(
        action="CREATE",
        entity_type="ITEM",
        entity_id=db_item.id,
        user_id=current_user.id,
        details=f"Created item {db_item.title}"
    )
    crud.create_audit_log(db, audit_log)
    
    return db_item

@router.post("/bulk", response_model=list[schemas.Item])
def create_items_bulk(
    items: list[schemas.ItemCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
        
    db_items = crud.create_items_bulk(db=db, items=items)
    
    # Log the action
    audit_log = audit_schemas.AuditLogCreate(
        action="BULK_CREATE",
        entity_type="ITEM",
        entity_id=0, # Generic ID for bulk action or maybe 0?
        user_id=current_user.id,
        details=f"Bulk created {len(db_items)} items"
    )
    crud.create_audit_log(db, audit_log)
    
    return db_items

@router.get("/", response_model=list[schemas.Item])
def read_items(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # All roles can view
    items = crud.get_items(db, skip=skip, limit=limit)
    return items

@router.get("/{item_id}", response_model=schemas.Item)
def read_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.put("/{item_id}", response_model=schemas.Item)
def update_item(
    item_id: int,
    item_update: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
    db_item = crud.update_item(db, item_id=item_id, item_update=item_update)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
        
    audit_log = audit_schemas.AuditLogCreate(
        action="UPDATE",
        entity_type="ITEM",
        entity_id=db_item.id,
        user_id=current_user.id,
        details=f"Updated item {db_item.title}"
    )
    crud.create_audit_log(db, audit_log)
    
    return db_item

@router.patch("/{item_id}/quantity", response_model=schemas.Item)
def update_quantity(
    item_id: int,
    quantity_update: schemas.ItemQuantityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role not in [models.Role.MANAGER, models.Role.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Manager or Admin access required"
        )
    db_item = crud.update_item_quantity(db, item_id=item_id, quantity=quantity_update.quantity)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
        
    audit_log = audit_schemas.AuditLogCreate(
        action="UPDATE_QUANTITY",
        entity_type="ITEM",
        entity_id=db_item.id,
        user_id=current_user.id,
        details=f"Updated quantity to {quantity_update.quantity}"
    )
    crud.create_audit_log(db, audit_log)
    
    return db_item

@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
    
    db_item = crud.get_item(db, item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(db_item)
    db.commit()
    
    audit_log = audit_schemas.AuditLogCreate(
        action="DELETE",
        entity_type="ITEM",
        entity_id=item_id,
        user_id=current_user.id,
        details=f"Deleted item {db_item.title}"
    )
    crud.create_audit_log(db, audit_log)
    
    return None
