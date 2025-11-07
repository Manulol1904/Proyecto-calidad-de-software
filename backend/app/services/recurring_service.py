from datetime import datetime, timedelta
from typing import List
from bson import ObjectId
from app.database.mongodb import get_collection
import logging

logger = logging.getLogger(__name__)

class RecurringService:
    """Servicio para manejar gastos recurrentes"""
    
    async def process_recurring_expenses(self):
        """Procesa todos los gastos recurrentes del sistema"""
        expenses_collection = await get_collection("expenses")
        
        recurring_expenses = await expenses_collection.find({
            "is_recurring": True,
            "parent_recurring_id": None
        }).to_list(None)
        
        created_count = 0
        for recurring_exp in recurring_expenses:
            created = await self._create_monthly_instance(recurring_exp)
            if created:
                created_count += 1
        
        logger.info(f"✅ Procesados gastos recurrentes: {created_count} nuevos creados")
        return created_count
    
    async def _create_monthly_instance(self, recurring_expense: dict) -> bool:
        """Crea una instancia del gasto recurrente si no existe para el mes actual"""
        expenses_collection = await get_collection("expenses")
        
        today = datetime.utcnow()
        recurrence_day = recurring_expense.get("recurrence_day", 1)
        
        # Ajustar día
        try:
            target_date = datetime(today.year, today.month, recurrence_day)
        except ValueError:
            if today.month == 12:
                next_month = datetime(today.year + 1, 1, 1)
            else:
                next_month = datetime(today.year, today.month + 1, 1)
            target_date = next_month - timedelta(days=1)
        
        # Verificar existencia previa
        existing = await expenses_collection.find_one({
            "parent_recurring_id": ObjectId(recurring_expense["_id"]),
            "date": {
                "$gte": datetime(today.year, today.month, 1),
                "$lt": datetime(today.year + 1, 1, 1) if today.month == 12
                       else datetime(today.year, today.month + 1, 1)
            }
        })
        if existing:
            return False
        
        # Crear nueva instancia
        new_instance = {
            "user_id": recurring_expense["user_id"],
            "title": recurring_expense["title"],
            "amount": recurring_expense["amount"],
            "category": recurring_expense["category"],
            "description": recurring_expense.get("description", ""),
            "date": target_date,
            "type": recurring_expense["type"],
            "is_recurring": False,
            "recurrence_day": None,
            "parent_recurring_id": ObjectId(recurring_expense["_id"]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await expenses_collection.insert_one(new_instance)
        logger.info(f"📅 Creada instancia recurrente: {recurring_expense['title']} para {target_date.strftime('%Y-%m-%d')}")
        return True
    
    async def get_recurring_expenses(self, user_id: str) -> List[dict]:
        """Obtiene todos los gastos recurrentes de un usuario"""
        expenses_collection = await get_collection("expenses")
        return await expenses_collection.find({
            "user_id": ObjectId(user_id),
            "is_recurring": True,
            "parent_recurring_id": None
        }).to_list(None)
    
    async def delete_recurring_expense(self, expense_id: str, user_id: str, delete_future: bool = False):
        """Elimina un gasto recurrente y opcionalmente sus instancias futuras"""
        expenses_collection = await get_collection("expenses")
        
        result = await expenses_collection.delete_one({
            "_id": ObjectId(expense_id),
            "user_id": ObjectId(user_id)
        })
        
        if result.deleted_count > 0 and delete_future:
            await expenses_collection.delete_many({
                "parent_recurring_id": ObjectId(expense_id),
                "date": {"$gte": datetime.utcnow()}
            })
            logger.info("🗑️ Eliminado gasto recurrente y sus instancias futuras")
        
        return result.deleted_count > 0
