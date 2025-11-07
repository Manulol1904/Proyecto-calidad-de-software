from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """Schema for user creation"""
    password: str = Field(..., min_length=6, max_length=72)
    income: Optional[float] = Field(default=0.0, ge=0)
    income_type: Optional[str] = Field(default="monthly", pattern="^(monthly|biweekly)$")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john@example.com",
                "password": "securepassword123",
                "income": 3000000,
                "income_type": "biweekly"
            }
        }
    }


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }
    }

class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    is_active: bool
    created_at: datetime
    income: Optional[float] = 0.0
    income_type: Optional[str] = "monthly"
    last_reset_date: Optional[datetime] = None
    next_reset_date: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "username": "john",
                "email": "john@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "created_at": "2024-01-15T10:30:00Z",
                "income": 3000000,
                "income_type": "biweekly",
                "last_reset_date": "2025-01-01T00:00:00Z",
                "next_reset_date": "2025-01-15T00:00:00Z"
            }
        }
    }

class UserUpdate(BaseModel):
    """Schema for user update"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    income: Optional[float] = Field(None, ge=0)
    income_type: Optional[str] = Field(None, pattern="^(monthly|biweekly)$")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "johndoe_updated",
                "full_name": "John Doe Updated",
                "is_active": True,
                "income": 3000000,
                "income_type": "biweekly"
            }
        }
    }

class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenData(BaseModel):
    """Schema for token data"""
    email: Optional[str] = None