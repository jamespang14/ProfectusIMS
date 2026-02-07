from fastapi import FastAPI
from .db import models
from .db.database import engine
from .routers import items, auth, users, audit

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router, tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(audit.router, prefix="/audit-logs", tags=["audit"])
