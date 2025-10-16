from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.database.mongodb import get_collection

class ExpenseService:
    """Service for expense operations"""
    
    async def create_expense(self, user_id: str, expense_data: ExpenseCreate) -> Expense:
        """Create a new expense"""
        expenses_collection = await get_collection("expenses")
        
        expense_dict = expense_data.dict()
        expense_dict["user_id"] = ObjectId(user_id)
        expense_dict["created_at"] = datetime.utcnow()
        expense_dict["updated_at"] = datetime.utcnow()
        
        result = await expenses_collection.insert_one(expense_dict)
        expense_dict["_id"] = result.inserted_id
        
        return Expense(**expense_dict)
    
    async def get_expense_by_id(self, expense_id: str, user_id: str) -> Optional[Expense]:
        """Get expense by ID for a specific user"""
        expenses_collection = await get_collection("expenses")
        
        if not ObjectId.is_valid(expense_id):
            return None
        
        expense_data = await expenses_collection.find_one({
            "_id": ObjectId(expense_id),
            "user_id": ObjectId(user_id)
        })
        
        if expense_data:
            return Expense(**expense_data)
        return None
    
    async def get_user_expenses(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Expense]:
        """Get user's expenses with optional filtering"""
        expenses_collection = await get_collection("expenses")
        
        # Build filter query
        filter_query = {"user_id": ObjectId(user_id)}
        
        if category:
            filter_query["category"] = {"$regex": category, "$options": "i"}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_query["date"] = date_filter
        
        # Get expenses
        cursor = expenses_collection.find(filter_query).sort("date", -1).skip(skip).limit(limit)
        expenses = []
        
        async for expense_doc in cursor:
            expenses.append(Expense(**expense_doc))
        
        return expenses
    
    async def update_expense(
        self, 
        expense_id: str, 
        user_id: str, 
        expense_update: ExpenseUpdate
    ) -> Optional[Expense]:
        """Update an existing expense"""
        expenses_collection = await get_collection("expenses")
        
        if not ObjectId.is_valid(expense_id):
            return None
        
        # Check if expense exists and belongs to user
        existing_expense = await self.get_expense_by_id(expense_id, user_id)
        if not existing_expense:
            return None
        
        # Prepare update data
        update_data = expense_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            
            await expenses_collection.update_one(
                {"_id": ObjectId(expense_id)},
                {"$set": update_data}
            )
        
        # Return updated expense
        return await self.get_expense_by_id(expense_id, user_id)
    
    async def delete_expense(self, expense_id: str, user_id: str) -> bool:
        """Delete an expense"""
        expenses_collection = await get_collection("expenses")
        
        if not ObjectId.is_valid(expense_id):
            return False
        
        result = await expenses_collection.delete_one({
            "_id": ObjectId(expense_id),
            "user_id": ObjectId(user_id)
        })
        
        return result.deleted_count > 0
    
    async def get_expense_stats(
        self, 
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get expense statistics for a user"""
        expenses_collection = await get_collection("expenses")
        
        # Build filter query
        filter_query = {"user_id": ObjectId(user_id)}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_query["date"] = date_filter
        
        # Aggregate statistics
        pipeline = [
            {"$match": filter_query},
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1},
                    "avg_amount": {"$avg": "$amount"},
                    "max_amount": {"$max": "$amount"},
                    "min_amount": {"$min": "$amount"}
                }
            }
        ]
        
        result = await expenses_collection.aggregate(pipeline).to_list(1)
        
        if not result:
            return {
                "total_amount": 0,
                "count": 0,
                "avg_amount": 0,
                "max_amount": 0,
                "min_amount": 0
            }
        
        return result[0]
    
    async def get_expenses_by_category(
        self, 
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get expenses grouped by category"""
        expenses_collection = await get_collection("expenses")
        
        # Build filter query
        filter_query = {"user_id": ObjectId(user_id)}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_query["date"] = date_filter
        
        # Aggregate by category
        pipeline = [
            {"$match": filter_query},
            {
                "$group": {
                    "_id": "$category",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"total_amount": -1}}
        ]
        
        result = await expenses_collection.aggregate(pipeline).to_list(None)
        
        return [
            {
                "category": item["_id"],
                "total_amount": item["total_amount"],
                "count": item["count"]
            }
            for item in result
        ]
    
    async def get_total_expenses_count(self, user_id: str) -> int:
        """Get total number of expenses for a user"""
        expenses_collection = await get_collection("expenses")
        return await expenses_collection.count_documents({"user_id": ObjectId(user_id)})
