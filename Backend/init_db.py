from sqlalchemy.orm import Session
from app.db import models
from app.db.database import SessionLocal, engine
from app.core.security import get_password_hash

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
    
    db.commit()
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
