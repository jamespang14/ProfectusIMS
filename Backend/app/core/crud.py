from sqlalchemy.orm import Session
from ..db import models
from ..schemas import item as schemas
from ..schemas import audit as audit_schemas

def create_audit_log(db: Session, log: audit_schemas.AuditLogCreate):
    db_log = models.AuditLog(
        action=log.action,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        user_id=log.user_id,
        details=log.details
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_item(db: Session, item_id: int):
    return db.query(models.Item).filter(models.Item.id == item_id).first()

def get_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Item).offset(skip).limit(limit).all()

def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(
        title=item.title, 
        description=item.description, 
        # owner_id=item.owner_id,
        price=item.price,
        category=item.category
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(db: Session, item_id: int, item_update: schemas.ItemUpdate):
    db_item = get_item(db, item_id)
    if not db_item:
        return None
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item_quantity(db: Session, item_id: int, quantity: int):
    db_item = get_item(db, item_id)
    if not db_item:
        return None
    db_item.quantity = quantity
    db.commit()
    db.refresh(db_item)
    db.refresh(db_item)
    return db_item

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.AuditLog).filter(models.AuditLog.user_id == user_id).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_item(db: Session, item_id: int, skip: int = 0, limit: int = 100):
    # Note: entity_id is generic, but here we assume entity_type='ITEM' could be filtered if needed.
    # For now, just filtering by entity_id and entity_type="ITEM" is safer to avoid collisions if user_ids and item_ids overlap.
    return db.query(models.AuditLog).filter(models.AuditLog.entity_id == item_id, models.AuditLog.entity_type == "ITEM").order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
