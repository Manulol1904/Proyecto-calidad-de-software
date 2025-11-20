"""
Configuración global de pytest para el backend
"""
import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import get_settings
from app.database.mongodb import db, connect_to_mongo, close_mongo_connection

# ============================================================
# 🔹 Event Loop Configuration
# ============================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# ============================================================
# 🔹 Database Configuration
# ============================================================

@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    """
    Configurar base de datos de prueba
    Se ejecuta una vez al inicio de la sesión de tests
    """
    print("\n🔧 Configurando base de datos de prueba...")
    
    # Conectar a MongoDB
    await connect_to_mongo()
    
    yield
    
    # Limpiar después de todos los tests
    print("\n🧹 Limpiando base de datos de prueba...")
    await close_mongo_connection()

@pytest.fixture(autouse=True)
async def cleanup_collections():
    """
    Limpiar colecciones después de cada test
    Esto asegura que cada test comience con datos limpios
    """
    yield
    
    # Limpiar colecciones después del test
    if db.database is not None:
        try:
            # Eliminar solo documentos de prueba (emails que contengan "test")
            await db.database.users.delete_many({"email": {"$regex": "test"}})
            await db.database.expenses.delete_many({})
        except Exception as e:
            print(f"⚠️ Error limpiando colecciones: {e}")

# ============================================================
# 🔹 Application Settings
# ============================================================

@pytest.fixture
def app_settings():
    """Get application settings"""
    return get_settings()

# ============================================================
# 🔹 MongoDB Client
# ============================================================

@pytest.fixture
async def mongo_client():
    """Provide MongoDB client for tests"""
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    yield client
    client.close()

@pytest.fixture
async def test_database(mongo_client):
    """Provide test database"""
    settings = get_settings()
    return mongo_client[settings.database_name]

# ============================================================
# 🔹 Pytest Configuration
# ============================================================

def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "asyncio: mark test as an async test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "performance: mark test as performance/latency check"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )

# ============================================================
# 🔹 Test Utilities
# ============================================================

@pytest.fixture
def sample_user_data():
    """Datos de usuario de prueba reutilizables"""
    from datetime import datetime
    return {
        "email": f"test_{datetime.utcnow().timestamp()}@example.com",
        "password": "testpass123",
        "username": f"testuser_{int(datetime.utcnow().timestamp())}",
        "full_name": "Test User",
        "income": 3000000,
        "income_type": "monthly"
    }

@pytest.fixture
def sample_expense_data():
    """Datos de gasto de prueba reutilizables"""
    from datetime import datetime
    return {
        "title": "Test Expense",
        "amount": 50000,
        "category": "Test",
        "description": "Test description",
        "date": datetime.utcnow().isoformat(),
        "type": "expense",
        "is_recurring": False
    }

# ============================================================
# 🔹 Async Test Helpers
# ============================================================

@pytest.fixture
async def create_test_user():
    """Helper para crear usuario de prueba"""
    from app.services.auth_service import AuthService
    from app.schemas.user import UserCreate
    from datetime import datetime
    
    async def _create_user(**kwargs):
        auth_service = AuthService()
        default_data = {
            "email": f"test_{datetime.utcnow().timestamp()}@example.com",
            "password": "testpass123",
            "username": f"user_{int(datetime.utcnow().timestamp())}",
            "income": 3000000,
            "income_type": "monthly"
        }
        default_data.update(kwargs)
        user_data = UserCreate(**default_data)
        return await auth_service.create_user(user_data)
    
    return _create_user

@pytest.fixture
async def create_test_expense():
    """Helper para crear gasto de prueba"""
    from app.services.expense_service import ExpenseService
    from app.schemas.expense import ExpenseCreate
    from datetime import datetime
    
    async def _create_expense(user_id, **kwargs):
        expense_service = ExpenseService()
        default_data = {
            "title": "Test Expense",
            "amount": 50000,
            "category": "Test",
            "description": "Test description",
            "date": datetime.utcnow(),
            "type": "expense",
            "is_recurring": False
        }
        default_data.update(kwargs)
        expense_data = ExpenseCreate(**default_data)
        return await expense_service.create_expense(user_id, expense_data)
    
    return _create_expense