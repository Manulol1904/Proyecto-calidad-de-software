from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId

class Expense(BaseModel):
    """Expense model for MongoDB"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    title: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    date: datetime = Field(default_factory=datetime.utcnow)
    type: str = Field(default="expense", pattern="^(income|expense)$")  # ✅ Campo type
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "title": "Comida",
                "amount": 25.50,
                "category": "Alimentación",
                "description": "Almuerzo en restaurante",
                "date": "2024-01-15T12:00:00Z",
                "type": "expense"
            }
        }
    }