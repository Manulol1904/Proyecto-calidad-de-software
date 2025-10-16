from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import asyncio
from app.config.settings import get_settings

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

# Global database instance
db = Database()

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    settings = get_settings()
    
    try:
        db.client = AsyncIOMotorClient(settings.mongodb_url)
        db.database = db.client[settings.database_name]
        
        # Test the connection
        await db.client.admin.command('ping')
        print("✅ Conectado a MongoDB exitosamente")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        print(f"⚠️ MongoDB no disponible: {e}")
        print("🔄 El servidor iniciará sin conexión a base de datos")
        print("💡 Asegúrate de que MongoDB esté ejecutándose en:", settings.mongodb_url)
        # No lanzamos la excepción para permitir que el servidor inicie

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("🔌 Conexión a MongoDB cerrada")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # User collection indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("username", unique=True)
        
        # Expense collection indexes
        await db.database.expenses.create_index("user_id")
        await db.database.expenses.create_index("date")
        await db.database.expenses.create_index("category")
        await db.database.expenses.create_index([("user_id", 1), ("date", -1)])
        await db.database.expenses.create_index([("user_id", 1), ("category", 1)])
        
        print("📊 Índices de base de datos creados")
    except Exception as e:
        print(f"⚠️ Error creando índices: {e}")

async def get_collection(collection_name: str):
    """Get a specific collection from the database"""
    database = await get_database()
    return database[collection_name]
