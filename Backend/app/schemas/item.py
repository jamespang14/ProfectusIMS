from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: int = 0
    category: str = "Uncategorized"
    # owner_id: int

class ItemCreate(ItemBase):
    quantity: int = 0

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    category: Optional[str] = None
    quantity: Optional[int] = None

class ItemQuantityUpdate(BaseModel):
    quantity: int

class Item(ItemBase):
    id: int
    quantity: int
    last_updated: datetime

    class Config:
        from_attributes = True