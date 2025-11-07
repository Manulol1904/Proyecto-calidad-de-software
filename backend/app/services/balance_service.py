from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class BalanceService:
    """Servicio para gestionar balance y reset de ingresos"""
    
    def __init__(self, db):
        self.db = db
        self.users_collection = db.users
        self.expenses_collection = db.expenses
    
    def calculate_next_reset_date(self, income_type: str, current_date: datetime = None) -> datetime:
        """
        Calcula la próxima fecha de reset según el tipo de ingreso
        
        Args:
            income_type: 'monthly' o 'biweekly'
            current_date: Fecha actual (por defecto datetime.utcnow())
        
        Returns:
            datetime: Próxima fecha de reset
        """
        if current_date is None:
            current_date = datetime.utcnow()
        
        year = current_date.year
        month = current_date.month
        day = current_date.day
        
        if income_type == "monthly":
            # Reset el día 1 de cada mes
            if day >= 1:
                # Ya pasó el día 1, próximo reset es el 1 del mes siguiente
                if month == 12:
                    return datetime(year + 1, 1, 1, 0, 0, 0)
                else:
                    return datetime(year, month + 1, 1, 0, 0, 0)
            else:
                # Aún no ha llegado el día 1
                return datetime(year, month, 1, 0, 0, 0)
        
        elif income_type == "biweekly":
            # Reset el día 1 y 15 de cada mes
            if day < 15:
                # Próximo reset es el 15 de este mes
                return datetime(year, month, 15, 0, 0, 0)
            else:
                # Próximo reset es el 1 del mes siguiente
                if month == 12:
                    return datetime(year + 1, 1, 1, 0, 0, 0)
                else:
                    return datetime(year, month + 1, 1, 0, 0, 0)
        
        # Por defecto, retornar mensual
        return datetime(year, month + 1 if month < 12 else 1, 1, 0, 0, 0)
    
    async def should_reset_user_balance(self, user: Dict[str, Any]) -> bool:
        """
        Verifica si el balance del usuario debe resetearse
        
        Args:
            user: Diccionario con datos del usuario
        
        Returns:
            bool: True si debe resetearse, False en caso contrario
        """
        current_date = datetime.utcnow()
        next_reset = user.get("next_reset_date")
        
        if not next_reset:
            return True  # Primera vez, debe inicializarse
        
        # Si la fecha actual es mayor o igual a la próxima fecha de reset
        return current_date >= next_reset
    
    async def reset_user_balance(self, user_id: str) -> Dict[str, Any]:
        """
        Resetea el balance del usuario según su tipo de ingreso
        
        Args:
            user_id: ID del usuario
        
        Returns:
            dict: Información sobre el reset
        """
        try:
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return {"success": False, "message": "Usuario no encontrado"}
            
            income_type = user.get("income_type", "monthly")
            income = user.get("income", 0.0)
            current_date = datetime.utcnow()
            
            # Calcular próxima fecha de reset
            next_reset = self.calculate_next_reset_date(income_type, current_date)
            
            # Actualizar usuario
            await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "last_reset_date": current_date,
                        "next_reset_date": next_reset,
                        "updated_at": current_date
                    }
                }
            )
            
            logger.info(f"✅ Balance reseteado para usuario {user_id}. Tipo: {income_type}, Próximo reset: {next_reset}")
            
            return {
                "success": True,
                "user_id": user_id,
                "income_type": income_type,
                "income_amount": income,
                "last_reset": current_date,
                "next_reset": next_reset
            }
            
        except Exception as e:
            logger.error(f"❌ Error reseteando balance de usuario {user_id}: {e}")
            return {"success": False, "message": str(e)}
    
    async def get_user_current_income(self, user_id: str) -> float:
        """
        Obtiene el ingreso actual del usuario considerando el tipo de pago
        
        Args:
            user_id: ID del usuario
        
        Returns:
            float: Ingreso actual disponible
        """
        try:
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return 0.0
            
            income = user.get("income", 0.0)
            income_type = user.get("income_type", "monthly")
            current_date = datetime.utcnow()
            day = current_date.day
            
            # Si es mensual, siempre retorna el ingreso completo
            if income_type == "monthly":
                return income
            
            # Si es quincenal
            if income_type == "biweekly":
                # Primera quincena (día 1-14): retorna la mitad
                if day < 15:
                    return income / 2
                # Segunda quincena (día 15-fin): retorna el ingreso completo
                else:
                    return income
            
            return income
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo ingreso actual: {e}")
            return 0.0
    
    async def check_and_reset_all_users(self) -> Dict[str, Any]:
        """
        Verifica y resetea el balance de todos los usuarios que necesiten reset
        
        Returns:
            dict: Estadísticas del proceso
        """
        try:
            users = await self.users_collection.find({}).to_list(None)
            reset_count = 0
            errors = []
            
            for user in users:
                user_id = str(user["_id"])
                
                # Verificar si necesita reset
                if await self.should_reset_user_balance(user):
                    result = await self.reset_user_balance(user_id)
                    
                    if result.get("success"):
                        reset_count += 1
                    else:
                        errors.append({
                            "user_id": user_id,
                            "error": result.get("message")
                        })
            
            logger.info(f"✅ Proceso de reset completado. {reset_count} usuarios reseteados")
            
            return {
                "success": True,
                "reset_count": reset_count,
                "total_users": len(users),
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"❌ Error en reset masivo: {e}")
            return {
                "success": False,
                "message": str(e)
            }
    
    async def initialize_user_dates(self, user_id: str) -> Dict[str, Any]:
        """
        Inicializa las fechas de reset para un usuario nuevo o existente
        
        Args:
            user_id: ID del usuario
        
        Returns:
            dict: Resultado de la inicialización
        """
        try:
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return {"success": False, "message": "Usuario no encontrado"}
            
            # Si ya tiene fechas configuradas, no hacer nada
            if user.get("next_reset_date"):
                return {"success": True, "message": "Usuario ya inicializado"}
            
            # Inicializar fechas
            return await self.reset_user_balance(user_id)
            
        except Exception as e:
            logger.error(f"❌ Error inicializando usuario {user_id}: {e}")
            return {"success": False, "message": str(e)}