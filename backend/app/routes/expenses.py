from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse, 
    ExpenseListResponse, ExpenseStats, CategoryStats
)
from app.models.user import User
from app.services.expense_service import ExpenseService
from app.services.recurring_service import RecurringService
from app.utils.dependencies import get_current_active_user

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("/", response_model=ExpenseListResponse)
async def get_expenses(
    skip: int = Query(0, ge=0, description="Number of expenses to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of expenses to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[datetime] = Query(None, description="Filter expenses from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter expenses until this date"),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's expenses with optional filtering"""
    expense_service = ExpenseService()
    
    expenses = await expense_service.get_user_expenses(
        user_id=str(current_user.id),
        skip=skip,
        limit=limit,
        category=category,
        start_date=start_date,
        end_date=end_date
    )
    
    total = await expense_service.get_total_expenses_count(str(current_user.id))
    
    expense_responses = [
        ExpenseResponse(
            id=str(expense.id),
            user_id=str(expense.user_id),
            title=expense.title,
            amount=abs(expense.amount),
            category=expense.category,
            description=expense.description,
            date=expense.date,
            type=expense.type,
            is_recurring=expense.is_recurring,
            recurrence_day=expense.recurrence_day,
            parent_recurring_id = str(expense.parent_recurring_id) if expense is not None else None,
            created_at=expense.created_at,
            updated_at=expense.updated_at
        )
        for expense in expenses
    ]
    
    return ExpenseListResponse(
        expenses=expense_responses,
        total=total,
        page=(skip // limit) + 1,
        limit=limit
    )

# NOTE: get_expense (/{expense_id}) is declared later to avoid catching specific
# routes like /recurring or /stats when the path parameter would match them.

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new expense"""
    expense_service = ExpenseService()
    
    print(f"📥 Datos recibidos: {expense_data.dict()}")
    
    expense = await expense_service.create_expense(str(current_user.id), expense_data)
    
    print(f"💾 Guardado en DB: amount={expense.amount}, type={expense.type}")
    
    return ExpenseResponse(
        id=str(expense.id),
        user_id=str(expense.user_id),
        title=expense.title,
        amount=abs(expense.amount),
        category=expense.category,
        description=expense.description,
        date=expense.date,
        type=expense.type,
        is_recurring=expense.is_recurring,
        recurrence_day=expense.recurrence_day,
        parent_recurring_id = str(expense.parent_recurring_id) if expense is not None else None,
        created_at=expense.created_at,
        updated_at=expense.updated_at
    )

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update an existing expense"""
    expense_service = ExpenseService()
    
    expense = await expense_service.update_expense(
        expense_id, str(current_user.id), expense_update
    )
    
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return ExpenseResponse(
        id=str(expense.id),
        user_id=str(expense.user_id),
        title=expense.title,
        amount=abs(expense.amount),
        category=expense.category,
        description=expense.description,
        date=expense.date,
        type=expense.type,
        is_recurring=expense.is_recurring,
        recurrence_day=expense.recurrence_day,
        parent_recurring_id = str(expense.parent_recurring_id) if expense is not None else None,
        created_at=expense.created_at,
        updated_at=expense.updated_at
    )

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete an expense"""
    expense_service = ExpenseService()
    
    success = await expense_service.delete_expense(expense_id, str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

@router.get("/stats/summary", response_model=dict)
async def get_expense_summary(
    current_user: User = Depends(get_current_active_user),
    start_date: Optional[datetime] = Query(None, description="Start date for statistics"),
    end_date: Optional[datetime] = Query(None, description="End date for statistics")
):
    """Get expense summary statistics"""
    expense_service = ExpenseService()
    
    stats = await expense_service.get_expense_stats(
        user_id=str(current_user.id),
        start_date=start_date,
        end_date=end_date
    )
    
    # stats already contains keys like income_total, expense_total, balance
    return stats

@router.get("/stats/by-category", response_model=List[CategoryStats])
async def get_expenses_by_category(
    current_user: User = Depends(get_current_active_user),
    start_date: Optional[datetime] = Query(None, description="Start date for statistics"),
    end_date: Optional[datetime] = Query(None, description="End date for statistics")
):
    """Get expenses grouped by category"""
    expense_service = ExpenseService()
    
    category_stats = await expense_service.get_expenses_by_category(
        user_id=str(current_user.id),
        start_date=start_date,
        end_date=end_date
    )
    
    return [CategoryStats(**stat) for stat in category_stats]

@router.get("/recurring", response_model=List[ExpenseResponse])
async def get_recurring_expenses(
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene todos los gastos recurrentes del usuario"""
    recurring_service = RecurringService()
    
    recurring = await recurring_service.get_recurring_expenses(str(current_user.id))
    
    return [
        ExpenseResponse(
            id=str(exp["_id"]),
            user_id=str(exp["user_id"]),
            title=exp["title"],
            amount=abs(exp["amount"]),
            category=exp["category"],
            description=exp.get("description"),
            date=exp["date"],
            type=exp["type"],
            is_recurring=exp.get("is_recurring", False),
            recurrence_day=exp.get("recurrence_day"),
            parent_recurring_id=str(exp.get("parent_recurring_id")) if exp.get("parent_recurring_id") else None,
            created_at=exp["created_at"],
            updated_at=exp["updated_at"]
        )
        for exp in recurring
    ]

@router.post("/recurring/process")
async def process_recurring_expenses(
    current_user: User = Depends(get_current_active_user)
):
    """
    Procesa los gastos recurrentes del usuario y crea instancias para el mes actual.
    Este endpoint puede ser llamado manualmente o por un cron job.
    """
    recurring_service = RecurringService()
    created_count = await recurring_service.process_recurring_expenses()
    
    return {
        "message": "Gastos recurrentes procesados",
        "created": created_count
    }

@router.delete("/recurring/{expense_id}")
async def delete_recurring_expense(
    expense_id: str,
    delete_future: bool = Query(False, description="Eliminar también instancias futuras"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Elimina un gasto recurrente.
    Si delete_future=True, elimina también todas las instancias futuras generadas.
    """
    recurring_service = RecurringService()
    
    success = await recurring_service.delete_recurring_expense(
        expense_id, 
        str(current_user.id),
        delete_future
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto recurrente no encontrado"
        )
    
    return {
        "message": "Gasto recurrente eliminado",
        "deleted_future": delete_future
    }
@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_active_user)
):
    auth_service = AuthService()
    user = await auth_service.get_user_by_id(str(current_user.id))

    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    await auth_service.update_password(user.email, new_password)
    return {"message": "Contraseña actualizada correctamente"}


# Route to get a specific expense by ID (placed after specific paths to avoid
# being matched for routes like /recurring)
@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific expense by ID"""
    expense_service = ExpenseService()
    
    expense = await expense_service.get_expense_by_id(expense_id, str(current_user.id))
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return ExpenseResponse(
        id=str(expense.id),
        user_id=str(expense.user_id),
        title=expense.title,
        amount=abs(expense.amount),
        category=expense.category,
        description=expense.description,
        date=expense.date,
        type=expense.type,
        is_recurring=expense.is_recurring,
        recurrence_day=expense.recurrence_day,
        parent_recurring_id = str(expense.parent_recurring_id) if expense is not None else None,
        created_at=expense.created_at,
        updated_at=expense.updated_at
    )

