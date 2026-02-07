from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AlertBase(BaseModel):
    item_id: Optional[int] = None
    alert_type: str
    message: str

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None

    class Config:
        from_attributes = True

class AlertWithDetails(Alert):
    item_title: Optional[str] = None
    created_by_email: Optional[str] = None
    resolved_by_email: Optional[str] = None

    class Config:
        from_attributes = True
