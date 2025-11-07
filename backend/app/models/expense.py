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
    type: str = Field(default="expense", pattern="^(income|expense)$")
    
    # 🔁 Nuevos campos para recurrencia
    is_recurring: bool = Field(default=False)
    recurrence_day: Optional[int] = Field(None, ge=1, le=31)  # Día del mes (1-31)
    parent_recurring_id: Optional[PyObjectId] = Field(None)  # ID del gasto recurrente padre
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "title": "Netflix",
                "amount": 45000,
                "category": "Suscripciones",
                "description": "Suscripción mensual",
                "date": "2024-01-15T12:00:00Z",
                "type": "expense",
                "is_recurring": True,
                "recurrence_day": 15
            }
        }
    }