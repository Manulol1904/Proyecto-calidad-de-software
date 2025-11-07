from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.database.mongodb import get_collection
from app.utils.security import get_password_hash, verify_password
from app.services.balance_service import BalanceService


class AuthService:
    """Service for authentication operations"""

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email from database"""
        users_collection = await get_collection("users")
        user_data = await users_collection.find_one({"email": email})
        if user_data:
            return User(**user_data)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID from database"""
        users_collection = await get_collection("users")
        user_data = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return User(**user_data)
        return None

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username from database"""
        users_collection = await get_collection("users")
        user_data = await users_collection.find_one({"username": username})
        if user_data:
            return User(**user_data)
        return None

    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        users_collection = await get_collection("users")
        db = users_collection.database

        # Check if user already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("Email already registered")

        # Si no envía username, se genera automáticamente a partir del correo
        username = user_data.username or user_data.email.split("@")[0]

        # Check for username collisions
        existing_username = await self.get_user_by_username(username)
        if existing_username:
            username = f"{username}_{int(datetime.utcnow().timestamp())}"

        # Hashear contraseña
        hashed_password = get_password_hash(user_data.password)
        
        # Obtener tipo de ingreso y calcular fechas
        income_type = getattr(user_data, "income_type", "monthly")
        income = getattr(user_data, "income", 0.0)
        
        # Inicializar servicio de balance para calcular fechas
        balance_service = BalanceService(db)
        current_date = datetime.utcnow()
        next_reset = balance_service.calculate_next_reset_date(income_type, current_date)

        # Crear el diccionario del nuevo usuario
        user_dict = {
            "username": username,
            "email": user_data.email,
            "full_name": getattr(user_data, "full_name", None),
            "hashed_password": hashed_password,
            "is_active": True,
            "income": income,
            "income_type": income_type,
            "last_reset_date": current_date,
            "next_reset_date": next_reset,
            "created_at": current_date,
            "updated_at": current_date
        }

        # Insertar en la base de datos
        result = await users_collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id

        print(f"✅ Usuario creado: {username}, Tipo ingreso: {income_type}, Próximo reset: {next_reset}")

        return User(**user_dict)

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        
        # Verificar y actualizar balance si es necesario
        users_collection = await get_collection("users")
        db = users_collection.database
        balance_service = BalanceService(db)
        
        user_dict = {
            "_id": user.id,
            "income_type": user.income_type,
            "income": user.income,
            "next_reset_date": user.next_reset_date
        }
        
        if await balance_service.should_reset_user_balance(user_dict):
            await balance_service.reset_user_balance(str(user.id))
            # Recargar usuario actualizado
            user = await self.get_user_by_id(str(user.id))
        
        return user

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[User]:
        """Update user information"""
        users_collection = await get_collection("users")
        db = users_collection.database

        # Check if user exists
        existing_user = await self.get_user_by_id(user_id)
        if not existing_user:
            return None

        # Prepare update data
        update_data = user_update.dict(exclude_unset=True)
        
        # Si se actualiza el tipo de ingreso, recalcular fechas
        if "income_type" in update_data or "income" in update_data:
            balance_service = BalanceService(db)
            income_type = update_data.get("income_type", existing_user.income_type)
            current_date = datetime.utcnow()
            next_reset = balance_service.calculate_next_reset_date(income_type, current_date)
            
            update_data["last_reset_date"] = current_date
            update_data["next_reset_date"] = next_reset
            
            print(f"🔄 Actualizando tipo de ingreso a: {income_type}, Próximo reset: {next_reset}")
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow()

            await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )

        # Return updated user
        return await self.get_user_by_id(user_id)

    async def deactivate_user(self, user_id: str) -> bool:
        """Deactivate a user account"""
        users_collection = await get_collection("users")

        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return result.modified_count > 0