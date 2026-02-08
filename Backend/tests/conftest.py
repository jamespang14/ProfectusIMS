import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import Base
from app.dependencies import get_db
from app.core import security
from app.db import models

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop tables
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token(db):
    user = models.User(
        email="admin@test.com", 
        hashed_password=security.get_password_hash("password"), 
        role=models.Role.ADMIN
    )
    db.add(user)
    db.commit()
    return security.create_access_token(data={"sub": user.email, "role": "admin"})

@pytest.fixture
def manager_token(db):
    user = models.User(
        email="manager@test.com", 
        hashed_password=security.get_password_hash("password"), 
        role=models.Role.MANAGER
    )
    db.add(user)
    db.commit()
    return security.create_access_token(data={"sub": user.email, "role": "manager"})

@pytest.fixture
def user_token(db):
    user = models.User(
        email="user@test.com", 
        hashed_password=security.get_password_hash("password"), 
        role=models.Role.VIEWER
    )
    db.add(user)
    db.commit()
    return security.create_access_token(data={"sub": user.email, "role": "viewer"})

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def manager_headers(manager_token):
    return {"Authorization": f"Bearer {manager_token}"}

@pytest.fixture
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}
