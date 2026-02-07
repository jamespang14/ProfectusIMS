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
    
    # Check and create alert if quantity is 0
    check_and_create_stock_alert(db, item_id, quantity)
    
    return db_item

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.AuditLog).filter(models.AuditLog.user_id == user_id).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_item(db: Session, item_id: int, skip: int = 0, limit: int = 100):
    # Note: entity_id is generic, but here we assume entity_type='ITEM' could be filtered if needed.
    # For now, just filtering by entity_id and entity_type="ITEM" is safer to avoid collisions if user_ids and item_ids overlap.
    return db.query(models.AuditLog).filter(models.AuditLog.entity_id == item_id, models.AuditLog.entity_type == "ITEM").order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

# Alert CRUD operations
from ..schemas import alerts as alert_schemas
from datetime import datetime

def create_alert(db: Session, alert: alert_schemas.AlertCreate, created_by: int = None):
    db_alert = models.Alert(
        item_id=alert.item_id,
        alert_type=alert.alert_type,
        message=alert.message,
        created_by=created_by
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(models.Alert)
    if status:
        query = query.filter(models.Alert.status == status)
    return query.order_by(models.Alert.created_at.desc()).offset(skip).limit(limit).all()

def get_alert(db: Session, alert_id: int):
    return db.query(models.Alert).filter(models.Alert.id == alert_id).first()

def resolve_alert(db: Session, alert_id: int, resolved_by: int):
    db_alert = get_alert(db, alert_id)
    if not db_alert:
        return None
    db_alert.status = models.AlertStatus.RESOLVED
    db_alert.resolved_at = datetime.utcnow()
    db_alert.resolved_by = resolved_by
    db.commit()
    db.refresh(db_alert)
    return db_alert

def delete_alert(db: Session, alert_id: int):
    db_alert = get_alert(db, alert_id)
    if not db_alert:
        return None
    db.delete(db_alert)
    db.commit()
    return db_alert

def check_and_create_stock_alert(db: Session, item_id: int, quantity: int):
    """Auto-create alert if quantity is 0"""
    if quantity == 0:
        item = get_item(db, item_id)
        if item:
            # Check if there's already an active out-of-stock alert for this item
            existing_alert = db.query(models.Alert).filter(
                models.Alert.item_id == item_id,
                models.Alert.alert_type == models.AlertType.OUT_OF_STOCK,
                models.Alert.status == models.AlertStatus.ACTIVE
            ).first()
            
            if not existing_alert:
                alert = alert_schemas.AlertCreate(
                    item_id=item_id,
                    alert_type=models.AlertType.OUT_OF_STOCK,
                    message=f"Item '{item.title}' is out of stock (quantity: 0)"
                )
                create_alert(db, alert)
