from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ExpenseBase(BaseModel):
    """Base expense schema"""
    title: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    date: datetime = Field(default_factory=datetime.utcnow)
    type: str = Field(default="expense", pattern="^(income|expense)$")

    # 🔁 Campos de recurrencia
    is_recurring: bool = Field(default=False, description="Indica si el gasto es recurrente")
    recurrence_day: Optional[int] = Field(
        None, ge=1, le=31, description="Día del mes en que se repite el gasto"
    )

    # 🔗 Campo para enlazar gastos generados automáticamente
    parent_recurring_id: Optional[str] = Field(
        None,
        description="ID del gasto original si este fue generado automáticamente a partir de un gasto recurrente"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Netflix",
                "amount": 45000,
                "category": "Suscripciones",
                "description": "Suscripción mensual",
                "date": "2024-01-15T12:00:00Z",
                "type": "expense",
                "is_recurring": True,
                "recurrence_day": 15,
                "parent_recurring_id": None
            }
        }
    }


class ExpenseCreate(ExpenseBase):
    """Schema for expense creation"""
    pass


class ExpenseUpdate(BaseModel):
    """Schema for expense update"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    date: Optional[datetime] = None
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    is_recurring: Optional[bool] = None
    recurrence_day: Optional[int] = Field(None, ge=1, le=31)
    parent_recurring_id: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Comida actualizada",
                "amount": 30000,
                "category": "Alimentación",
                "description": "Cena en restaurante",
                "type": "expense",
                "is_recurring": True,
                "recurrence_day": 15,
                "parent_recurring_id": None
            }
        }
    }


class ExpenseResponse(ExpenseBase):
    """Schema for expense response"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    parent_recurring_id: Optional[str] = Field(
        None, description="ID del gasto padre si este es una instancia de una recurrencia"
    )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "507f1f77bcf86cd799439012",
                "title": "Netflix",
                "amount": 45000,
                "category": "Suscripciones",
                "description": "Suscripción mensual",
                "date": "2024-01-15T12:00:00Z",
                "type": "expense",
                "is_recurring": True,
                "recurrence_day": 15,
                "parent_recurring_id": None,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }
    }



class ExpenseListResponse(BaseModel):
    """Schema for expense list response"""
    expenses: List[ExpenseResponse]
    total: int
    page: int
    limit: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "expenses": [],
                "total": 0,
                "page": 1,
                "limit": 10
            }
        }
    }


class ExpenseStats(BaseModel):
    """Schema for expense statistics"""
    total_amount: float
    count: int
    avg_amount: float
    max_amount: float
    min_amount: float

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_amount": 1500.75,
                "count": 25,
                "avg_amount": 60.03,
                "max_amount": 500.00,
                "min_amount": 5.50
            }
        }
    }


class CategoryStats(BaseModel):
    """Schema for category statistics"""
    category: str
    total_amount: float
    count: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "category": "Alimentación",
                "total_amount": 450.25,
                "count": 15
            }
        }
    }


class WebSocketMessage(BaseModel):
    """Schema for WebSocket messages"""
    type: str
    payload: dict

    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "new_expense",
                "payload": {
                    "id": "507f1f77bcf86cd799439011",
                    "title": "Nuevo gasto",
                    "amount": 25500,
                    "type": "expense",
                    "is_recurring": True,
                    "recurrence_day": 15,
                    "parent_recurring_id": None
                }
            }
        }
    }
