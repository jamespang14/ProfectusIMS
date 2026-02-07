from sqlalchemy.orm import Session
from app.db import models
from app.db.database import SessionLocal, engine
from app.core.security import get_password_hash

def init_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Check if admin exists
    user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
    if not user:
        print("Creating admin user...")
        admin_user = models.User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin"),
            role=models.Role.ADMIN
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("Admin user created: admin@example.com / admin")
    else:
        print("Admin user already exists.")
    
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
