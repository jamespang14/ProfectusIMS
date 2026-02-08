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

def get_items(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(models.Item)
    if search:
        query = query.filter(models.Item.title.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(models.Item.last_updated.desc()).offset(skip).limit(limit).all()
    return items, total

def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(
        title=item.title, 
        description=item.description, 
        # owner_id=item.owner_id,
        price=item.price,
        category=item.category,
        quantity=item.quantity
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Check for logs/alerts
    if item.quantity == 0:
        check_and_create_stock_alert(db, db_item.id, 0)
        
    return db_item

def create_items_bulk(db: Session, items: list[schemas.ItemCreate]):
    db_items = []
    for item in items:
        db_item = models.Item(
            title=item.title, 
            description=item.description, 
            price=item.price,
            category=item.category,
            quantity=item.quantity
        )
        db.add(db_item)
        db_items.append(db_item)
    
    db.commit()
    
    # Refresh all and check for alerts
    for db_item in db_items:
        db.refresh(db_item)
        if db_item.quantity == 0:
            check_and_create_stock_alert(db, db_item.id, 0)
            
    return db_items

def update_item(db: Session, item_id: int, item_update: schemas.ItemUpdate):
    db_item = get_item(db, item_id)
    if not db_item:
        return None
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    
    if 'quantity' in update_data:
        check_and_create_stock_alert(db, item_id, update_data['quantity'])
        
        # Log quantity update
        create_audit_log(db, audit_schemas.AuditLogCreate(
            action="UPDATE",
            entity_type="ITEM",
            entity_id=db_item.id,
            user_id=1, # Default system/admin user for now as we don't have current_user here easily without refactoring
            details=f"Updated quantity to {update_data['quantity']}"
        ))

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
    
    # Log quantity update
    create_audit_log(db, audit_schemas.AuditLogCreate(
        action="UPDATE",
        entity_type="ITEM",
        entity_id=db_item.id,
        user_id=1, # Default system/admin user
        details=f"Updated quantity to {quantity}"
    ))
    
    return db_item

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100, user_id: int = None):
    query = db.query(models.AuditLog)
    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)
    total = query.count()
    items = query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return items, total

def get_audit_logs_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    query = db.query(models.AuditLog).filter(models.AuditLog.user_id == user_id)
    total = query.count()
    items = query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return items, total

def get_audit_logs_by_item(db: Session, item_id: int, skip: int = 0, limit: int = 100):
    # Note: entity_id is generic, but here we assume entity_type='ITEM' could be filtered if needed.
    # For now, just filtering by entity_id and entity_type="ITEM" is safer to avoid collisions if user_ids and item_ids overlap.
    query = db.query(models.AuditLog).filter(models.AuditLog.entity_id == item_id, models.AuditLog.entity_type == "ITEM")
    total = query.count()
    items = query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return items, total

# Alert CRUD operations
from ..schemas import alerts as alert_schemas
from datetime import datetime

from .email import send_email

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

    # Log create action
    if created_by:
        create_audit_log(db, audit_schemas.AuditLogCreate(
            action="CREATE",
            entity_type="ALERT",
            entity_id=db_alert.id,
            user_id=created_by,
            details=f"Alert started: {alert.alert_type} - {alert.message}"
        ))

    # Trigger email notification
    try:
        subject = f"New Alert: {alert.alert_type}"
        body = f"A new alert has been created:\n\nType: {alert.alert_type}\nMessage: {alert.message}\nItem ID: {alert.item_id}"
        send_email(subject, body)
    except Exception as e:
        print(f"Failed to send email alert: {e}")

    return db_alert

def get_alerts(db: Session, skip: int = 0, limit: int = 100, status: str = None, search: str = None):
    query = db.query(models.Alert)
    if status:
        query = query.filter(models.Alert.status == status)
    
    if search:
        # Join with Items table to search by item title
        query = query.join(models.Item, models.Alert.item_id == models.Item.id).filter(models.Item.title.ilike(f"%{search}%"))
        
    total = query.count()
    items = query.order_by(models.Alert.created_at.desc()).offset(skip).limit(limit).all()
    return items, total

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
    
    # Log resolve action
    create_audit_log(db, audit_schemas.AuditLogCreate(
        action="UPDATE",
        entity_type="ALERT",
        entity_id=db_alert.id,
        user_id=resolved_by,
        details="Alert resolved"
    ))
    
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
                alert_obj = create_alert(db, alert)
                
                # Log system auto-alert creation (using user_id=1 for admin/system)
                create_audit_log(db, audit_schemas.AuditLogCreate(
                    action="CREATE",
                    entity_type="ALERT",
                    entity_id=alert_obj.id,
                    user_id=1, # Assigning to admin/system user
                    details=f"System auto-alert: Item '{item.title}' is out of stock"
                ))
