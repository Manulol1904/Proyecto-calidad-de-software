from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse, 
    ExpenseListResponse, ExpenseStats, CategoryStats
)
from app.models.user import User
from app.services.expense_service import ExpenseService
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
            amount=expense.amount,
            category=expense.category,
            description=expense.description,
            date=expense.date,
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

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific expense by ID"""
    expense_service = ExpenseService()
    
    expense = await expense_service.get_expense_by_id(expense_id, str(current_user.id))
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return ExpenseResponse(
        id=str(expense.id),
        user_id=str(expense.user_id),
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date,
        created_at=expense.created_at,
        updated_at=expense.updated_at
    )

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new expense"""
    expense_service = ExpenseService()
    
    expense = await expense_service.create_expense(str(current_user.id), expense_data)
    
    return ExpenseResponse(
        id=str(expense.id),
        user_id=str(expense.user_id),
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date,
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
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    return ExpenseResponse(
        id=str(expense.id),
        user_id=str(expense.user_id),
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date,
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

@router.get("/stats/summary", response_model=ExpenseStats)
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
    
    return ExpenseStats(**stats)

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
