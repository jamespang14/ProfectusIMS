from typing import Optional
from pydantic import BaseModel
from ..db.models import Role

class UserBase(BaseModel):
    email: str
    role: Role = Role.VIEWER

class UserCreate(UserBase):
    password: str

class UserRoleUpdate(BaseModel):
    role: Role

class User(UserBase):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[Role] = None
