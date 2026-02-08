from sqlalchemy.orm import Session
from app.db import models
from app.db.database import SessionLocal, engine
from app.core.security import get_password_hash
import random
from datetime import datetime, timedelta

def init_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create admin user
    admin_user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
    if not admin_user:
        print("Creating admin user...")
        admin_user = models.User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin"),
            role=models.Role.ADMIN
        )
        db.add(admin_user)
        print("Admin user created: admin@example.com / admin")
    else:
        print("Admin user already exists.")
    
    # Create manager user
    manager_user = db.query(models.User).filter(models.User.email == "manager@example.com").first()
    if not manager_user:
        print("Creating manager user...")
        manager_user = models.User(
            email="manager@example.com",
            hashed_password=get_password_hash("manager"),
            role=models.Role.MANAGER
        )
        db.add(manager_user)
        print("Manager user created: manager@example.com / manager")
    else:
        print("Manager user already exists.")
    
    # Create viewer user
    viewer_user = db.query(models.User).filter(models.User.email == "viewer@example.com").first()
    if not viewer_user:
        print("Creating viewer user...")
        viewer_user = models.User(
            email="viewer@example.com",
            hashed_password=get_password_hash("viewer"),
            role=models.Role.VIEWER
        )
        db.add(viewer_user)
        print("Viewer user created: viewer@example.com / viewer")
    else:
        print("Viewer user already exists.")

    # Create dummy products
    if db.query(models.Item).count() == 0:
        print("Creating dummy products...")
        categories = ["Electronics", "Clothing", "Home", "Sports", "Books"]
        for i in range(1, 51):
            item = models.Item(
                title=f"Product {i}",
                description=f"Description for product {i}",
                quantity=random.randint(1, 100),
                price=random.randint(10, 1000),
                category=random.choice(categories),
                last_updated=datetime.utcnow() - timedelta(days=random.randint(0, 30))
            )
            db.add(item)
        print("50 dummy products created.")
    else:
        print("Products already exist.")

    # Create dummy audit logs
    if db.query(models.AuditLog).count() == 0:
        print("Creating dummy audit logs...")
        actions = ["CREATE", "UPDATE", "DELETE"]
        entity_types = ["ITEM", "USER"]
        for i in range(1, 101):
            audit_log = models.AuditLog(
                action=random.choice(actions),
                entity_type=random.choice(entity_types),
                entity_id=random.randint(1, 50),
                user_id=random.randint(1, 3), # Assuming user IDs 1-3 exist
                timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                details=f"Details for audit log {i}"
            )
            db.add(audit_log)
        print("100 dummy audit logs created.")
    else:
        print("Audit logs already exist.")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
