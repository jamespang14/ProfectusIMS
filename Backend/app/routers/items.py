from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core import crud
from ..schemas import item as schemas
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
    # Automatically assign owner_id based on current user (if we want that)
    # But schema might urge owner_id. Let's override it or check it.
    # For now, let's trust the schema but maybe we should forcefully set it?
    # item.owner_id = current_user.id # If we want to force ownership
    return crud.create_item(db=db, item=item)

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
    return db_item
