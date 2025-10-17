from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.database.mongodb import get_collection
from app.utils.security import get_password_hash, verify_password


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

        # ✅ Hashear contraseña
        hashed_password = get_password_hash(user_data.password)

        # ✅ Crear el diccionario del nuevo usuario
        user_dict = {
            "username": username,
            "email": user_data.email,
            "full_name": getattr(user_data, "full_name", None),
            "hashed_password": hashed_password,
            "is_active": True,
            "income": getattr(user_data, "income", 0.0),  # 👈 aquí se guarda el ingreso
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # ✅ Insertar en la base de datos
        result = await users_collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id

        return User(**user_dict)

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[User]:
        """Update user information"""
        users_collection = await get_collection("users")

        # Check if user exists
        existing_user = await self.get_user_by_id(user_id)
        if not existing_user:
            return None

        # Prepare update data
        update_data = user_update.dict(exclude_unset=True)
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
