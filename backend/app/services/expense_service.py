from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.database.mongodb import get_collection


def normalize_category(category: str) -> str:
    """Normaliza las categorías: primera letra mayúscula, sin espacios extra"""
    if not category:
        return "Sin Categoría"
    
    # Elimina espacios extra y convierte a título
    return ' '.join(word.capitalize() for word in category.strip().split())


class ExpenseService:
    """Service for expense and income operations"""
    
    async def create_expense(self, user_id: str, expense_data: ExpenseCreate) -> Expense:
        """Create a new expense or income"""
        expenses_collection = await get_collection("expenses")

        expense_dict = expense_data.dict()
        
        # 🔍 DEBUG: Ver qué llega
        print(f"🔍 EXPENSE SERVICE - Datos recibidos:")
        print(f"   - is_recurring: {expense_dict.get('is_recurring')} (type: {type(expense_dict.get('is_recurring'))})")
        print(f"   - recurrence_day: {expense_dict.get('recurrence_day')} (type: {type(expense_dict.get('recurrence_day'))})")
        
        # ✅ Normaliza la categoría antes de guardar
        expense_dict["category"] = normalize_category(expense_dict.get("category", ""))
        
        expense_dict["user_id"] = ObjectId(user_id)
        expense_dict["created_at"] = datetime.utcnow()
        expense_dict["updated_at"] = datetime.utcnow()

        # ✅ Asegurar que type esté definido
        if "type" not in expense_dict or not expense_dict["type"]:
            expense_dict["type"] = "expense"
        
        # ✅ IMPORTANTE: Asegurar que los campos de recurrencia existan
        if "is_recurring" not in expense_dict:
            expense_dict["is_recurring"] = False
        
        if "recurrence_day" not in expense_dict:
            expense_dict["recurrence_day"] = None
        
        # ✅ Si es recurrente, asegurar que recurrence_day sea int
        if expense_dict["is_recurring"] and expense_dict["recurrence_day"]:
            expense_dict["recurrence_day"] = int(expense_dict["recurrence_day"])
        
        # ✅ Si no es recurrente, recurrence_day debe ser None
        if not expense_dict["is_recurring"]:
            expense_dict["recurrence_day"] = None
        
        # ✅ parent_recurring_id siempre None para gastos nuevos
        expense_dict["parent_recurring_id"] = None
        
        print(f"💾 EXPENSE SERVICE - Guardando en DB:")
        print(f"   - is_recurring: {expense_dict['is_recurring']}")
        print(f"   - recurrence_day: {expense_dict['recurrence_day']}")
        print(f"   - type: {expense_dict['type']}")

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
        """Get user's expenses and incomes with optional filtering"""
        expenses_collection = await get_collection("expenses")

        # Filtro base
        filter_query = {"user_id": ObjectId(user_id)}

        if category:
            normalized_cat = normalize_category(category)
            filter_query["category"] = {"$regex": normalized_cat, "$options": "i"}

        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_query["date"] = date_filter

        cursor = expenses_collection.find(filter_query).sort("date", -1).skip(skip).limit(limit)
        expenses = []

        async for expense_doc in cursor:
            # ✅ Convertir ObjectId a str y asegurar campos de recurrencia
            expense_doc["_id"] = str(expense_doc["_id"])
            expense_doc["user_id"] = str(expense_doc["user_id"])

            expense_doc["is_recurring"] = bool(expense_doc.get("is_recurring", False))
            expense_doc["recurrence_day"] = expense_doc.get("recurrence_day")
            expense_doc["parent_recurring_id"] = (
                str(expense_doc["parent_recurring_id"])
                if expense_doc.get("parent_recurring_id")
                else None
            )

            expenses.append(Expense(**expense_doc))

        return expenses

    async def update_expense(
        self, 
        expense_id: str, 
        user_id: str, 
        expense_update: ExpenseUpdate
    ) -> Optional[Expense]:
        """Update an existing expense or income"""
        expenses_collection = await get_collection("expenses")

        if not ObjectId.is_valid(expense_id):
            return None

        existing_expense = await self.get_expense_by_id(expense_id, user_id)
        if not existing_expense:
            return None

        update_data = expense_update.dict(exclude_unset=True)
        
        # ✅ Si se actualiza la categoría, normalízala
        if "category" in update_data:
            update_data["category"] = normalize_category(update_data["category"])
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow()

            await expenses_collection.update_one(
                {"_id": ObjectId(expense_id)},
                {"$set": update_data}
            )

        return await self.get_expense_by_id(expense_id, user_id)

    async def delete_expense(self, expense_id: str, user_id: str) -> bool:
        """Delete an expense or income"""
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
        """Get total stats for both income and expenses"""
        expenses_collection = await get_collection("expenses")

        filter_query = {"user_id": ObjectId(user_id)}

        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_query["date"] = date_filter

        # Separar ingresos y gastos
        pipeline = [
            {"$match": filter_query},
            {
                "$group": {
                    "_id": "$type",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            }
        ]

        result = await expenses_collection.aggregate(pipeline).to_list(None)

        income_total = 0
        expense_total = 0

        for r in result:
            if r["_id"] == "income":
                income_total = r["total_amount"]
            elif r["_id"] == "expense":
                expense_total = r["total_amount"]

        balance = income_total - expense_total

        return {
            "income_total": income_total,
            "expense_total": expense_total,
            "balance": balance
        }

    async def get_expenses_by_category(
        self, 
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get expenses grouped by category"""
        expenses_collection = await get_collection("expenses")

        filter_query = {"user_id": ObjectId(user_id), "type": "expense"}

        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            filter_query["date"] = date_filter

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
