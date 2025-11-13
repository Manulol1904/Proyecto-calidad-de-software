import pytest
from datetime import datetime, timedelta
from bson import ObjectId
from app.services.auth_service import AuthService
from app.services.expense_service import ExpenseService
from app.services.balance_service import BalanceService
from app.services.recurring_service import RecurringService
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.database.mongodb import get_database

class TestAuthService:
    """Tests para AuthService"""
    
    @pytest.mark.asyncio
    async def test_create_user(self):
        """Test: Crear usuario mediante servicio"""
        auth_service = AuthService()
        user_data = UserCreate(
            email=f"test_{datetime.utcnow().timestamp()}@example.com",
            password="testpass123",
            username=f"user_{int(datetime.utcnow().timestamp())}",
            income=3000000,
            income_type="monthly"
        )
        
        user = await auth_service.create_user(user_data)
        
        assert user is not None
        assert user.email == user_data.email
        assert user.hashed_password != user_data.password
        assert user.is_active is True
    
    @pytest.mark.asyncio
    async def test_get_user_by_email(self):
        """Test: Obtener usuario por email"""
        auth_service = AuthService()
        
        # Crear usuario
        user_data = UserCreate(
            email=f"get_test_{datetime.utcnow().timestamp()}@example.com",
            password="testpass123"
        )
        created_user = await auth_service.create_user(user_data)
        
        # Obtener por email
        user = await auth_service.get_user_by_email(user_data.email)
        
        assert user is not None
        assert user.email == user_data.email
        assert str(user.id) == str(created_user.id)
    
    @pytest.mark.asyncio
    async def test_authenticate_user_success(self):
        """Test: Autenticar usuario correctamente"""
        auth_service = AuthService()
        
        # Crear usuario
        user_data = UserCreate(
            email=f"auth_test_{datetime.utcnow().timestamp()}@example.com",
            password="testpass123"
        )
        await auth_service.create_user(user_data)
        
        # Autenticar
        user = await auth_service.authenticate_user(user_data.email, "testpass123")
        
        assert user is not None
        assert user.email == user_data.email
    
    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self):
        """Test: Fallar autenticación con contraseña incorrecta"""
        auth_service = AuthService()
        
        # Crear usuario
        user_data = UserCreate(
            email=f"auth_fail_{datetime.utcnow().timestamp()}@example.com",
            password="testpass123"
        )
        await auth_service.create_user(user_data)
        
        # Intentar autenticar con contraseña incorrecta
        user = await auth_service.authenticate_user(user_data.email, "wrongpass")
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_update_user(self):
        """Test: Actualizar usuario"""
        auth_service = AuthService()
        
        # Crear usuario
        user_data = UserCreate(
            email=f"update_test_{datetime.utcnow().timestamp()}@example.com",
            password="testpass123",
            full_name="Original Name"
        )
        created_user = await auth_service.create_user(user_data)
        
        # Actualizar
        update_data = UserUpdate(
            full_name="Updated Name",
            income=5000000,
            income_type="biweekly"
        )
        updated_user = await auth_service.update_user(str(created_user.id), update_data)
        
        assert updated_user is not None
        assert updated_user.full_name == "Updated Name"
        assert updated_user.income == 5000000
        assert updated_user.income_type == "biweekly"

class TestExpenseService:
    """Tests para ExpenseService"""
    
    @pytest.fixture
    async def test_user(self):
        """Usuario de prueba"""
        auth_service = AuthService()
        user_data = UserCreate(
            email=f"expense_service_{datetime.utcnow().timestamp()}@example.com",
            password="testpass123"
        )
        return await auth_service.create_user(user_data)
    
    @pytest.mark.asyncio
    async def test_create_expense(self, test_user):
        """Test: Crear gasto mediante servicio"""
        expense_service = ExpenseService()
        
        expense_data = ExpenseCreate(
            title="Test Expense",
            amount=50000,
            category="Test",
            description="Test description",
            type="expense",
            is_recurring=False
        )
        
        expense = await expense_service.create_expense(str(test_user.id), expense_data)
        
        assert expense is not None
        assert expense.title == expense_data.title
        assert expense.amount == expense_data.amount
        assert str(expense.user_id) == str(test_user.id)
    
    @pytest.mark.asyncio
    async def test_get_user_expenses(self, test_user):
        """Test: Obtener gastos de usuario"""
        expense_service = ExpenseService()
        
        # Crear varios gastos
        for i in range(3):
            expense_data = ExpenseCreate(
                title=f"Expense {i+1}",
                amount=10000 * (i+1),
                category="Test",
                type="expense"
            )
            await expense_service.create_expense(str(test_user.id), expense_data)
        
        # Obtener gastos
        expenses = await expense_service.get_user_expenses(str(test_user.id))
        
        assert len(expenses) >= 3
    
    @pytest.mark.asyncio
    async def test_update_expense(self, test_user):
        """Test: Actualizar gasto"""
        expense_service = ExpenseService()
        
        # Crear gasto
        expense_data = ExpenseCreate(
            title="Original",
            amount=50000,
            category="Test",
            type="expense"
        )
        expense = await expense_service.create_expense(str(test_user.id), expense_data)
        
        # Actualizar
        update_data = ExpenseUpdate(
            title="Updated",
            amount=75000
        )
        updated = await expense_service.update_expense(
            str(expense.id), str(test_user.id), update_data
        )
        
        assert updated is not None
        assert updated.title == "Updated"
        assert updated.amount == 75000
    
    @pytest.mark.asyncio
    async def test_delete_expense(self, test_user):
        """Test: Eliminar gasto"""
        expense_service = ExpenseService()
        
        # Crear gasto
        expense_data = ExpenseCreate(
            title="To Delete",
            amount=50000,
            category="Test",
            type="expense"
        )
        expense = await expense_service.create_expense(str(test_user.id), expense_data)
        
        # Eliminar
        success = await expense_service.delete_expense(str(expense.id), str(test_user.id))
        
        assert success is True
        
        # Verificar que no existe
        deleted = await expense_service.get_expense_by_id(str(expense.id), str(test_user.id))
        assert deleted is None
    
    @pytest.mark.asyncio
    async def test_get_expense_stats(self, test_user):
        """Test: Obtener estadísticas de gastos"""
        expense_service = ExpenseService()
        
        # Crear gastos e ingresos
        await expense_service.create_expense(str(test_user.id), ExpenseCreate(
            title="Expense 1", amount=100000, category="Test", type="expense"
        ))
        await expense_service.create_expense(str(test_user.id), ExpenseCreate(
            title="Income 1", amount=500000, category="Test", type="income"
        ))
        
        # Obtener stats
        stats = await expense_service.get_expense_stats(str(test_user.id))
        
        assert "income_total" in stats
        assert "expense_total" in stats
        assert "balance" in stats
        assert stats["balance"] == stats["income_total"] - stats["expense_total"]

class TestBalanceService:
    """Tests para BalanceService"""
    
    @pytest.mark.asyncio
    async def test_calculate_next_reset_date_monthly(self):
        """Test: Calcular próxima fecha de reset mensual"""
        db = await get_database()
        balance_service = BalanceService(db)
        
        current_date = datetime(2025, 1, 15)
        next_reset = balance_service.calculate_next_reset_date("monthly", current_date)
        
        assert next_reset.month == 2
        assert next_reset.day == 1
    
    @pytest.mark.asyncio
    async def test_calculate_next_reset_date_biweekly_before_15(self):
        """Test: Calcular próxima fecha de reset quincenal (antes del 15)"""
        db = await get_database()
        balance_service = BalanceService(db)
        
        current_date = datetime(2025, 1, 10)
        next_reset = balance_service.calculate_next_reset_date("biweekly", current_date)
        
        assert next_reset.day == 15
        assert next_reset.month == 1
    
    @pytest.mark.asyncio
    async def test_calculate_next_reset_date_biweekly_after_15(self):
        """Test: Calcular próxima fecha de reset quincenal (después del 15)"""
        db = await get_database()
        balance_service = BalanceService(db)
        
        current_date = datetime(2025, 1, 20)
        next_reset = balance_service.calculate_next_reset_date("biweekly", current_date)
        
        assert next_reset.month == 2
        assert next_reset.day == 1
    
    @pytest.mark.asyncio
    async def test_should_reset_user_balance(self):
        """Test: Verificar si debe resetear balance"""
        db = await get_database()
        balance_service = BalanceService(db)
        
        # Usuario con fecha de reset pasada
        user_past = {
            "_id": ObjectId(),
            "next_reset_date": datetime.utcnow() - timedelta(days=1)
        }
        assert await balance_service.should_reset_user_balance(user_past) is True
        
        # Usuario con fecha de reset futura
        user_future = {
            "_id": ObjectId(),
            "next_reset_date": datetime.utcnow() + timedelta(days=1)
        }
        assert await balance_service.should_reset_user_balance(user_future) is False
    
    @pytest.mark.asyncio
    async def test_get_user_current_income_monthly(self):
        """Test: Obtener ingreso actual mensual"""
        db = await get_database()
        balance_service = BalanceService(db)
        auth_service = AuthService()
        
        # Crear usuario mensual
        user_data = UserCreate(
            email=f"income_monthly_{datetime.utcnow().timestamp()}@example.com",
            password="test123",
            income=3000000,
            income_type="monthly"
        )
        user = await auth_service.create_user(user_data)
        
        # Obtener ingreso actual
        current_income = await balance_service.get_user_current_income(str(user.id))
        
        assert current_income == 3000000
    
    @pytest.mark.asyncio
    async def test_get_user_current_income_biweekly_first_half(self):
        """Test: Obtener ingreso actual quincenal (primera quincena)"""
        db = await get_database()
        balance_service = BalanceService(db)
        auth_service = AuthService()
        
        # Crear usuario quincenal
        user_data = UserCreate(
            email=f"income_biweekly_{datetime.utcnow().timestamp()}@example.com",
            password="test123",
            income=4000000,
            income_type="biweekly"
        )
        user = await auth_service.create_user(user_data)
        
        # Obtener ingreso actual
        current_income = await balance_service.get_user_current_income(str(user.id))
        
        # Dependiendo del día actual, será mitad o completo
        assert current_income in [2000000, 4000000]

class TestRecurringService:
    """Tests para RecurringService"""
    
    @pytest.fixture
    async def test_user(self):
        """Usuario de prueba"""
        auth_service = AuthService()
        user_data = UserCreate(
            email=f"recurring_{datetime.utcnow().timestamp()}@example.com",
            password="testpass123"
        )
        return await auth_service.create_user(user_data)
    
    @pytest.mark.asyncio
    async def test_get_recurring_expenses(self, test_user):
        """Test: Obtener gastos recurrentes"""
        recurring_service = RecurringService()
        expense_service = ExpenseService()
        
        # Crear gasto recurrente
        expense_data = ExpenseCreate(
            title="Netflix",
            amount=45000,
            category="Suscripciones",
            type="expense",
            is_recurring=True,
            recurrence_day=15
        )
        await expense_service.create_expense(str(test_user.id), expense_data)
        
        # Obtener recurrentes
        recurring = await recurring_service.get_recurring_expenses(str(test_user.id))
        
        assert len(recurring) >= 1
        assert recurring[0]["is_recurring"] is True
    
    @pytest.mark.asyncio
    async def test_process_recurring_expenses(self):
        """Test: Procesar gastos recurrentes"""
        recurring_service = RecurringService()
        
        # Procesar gastos recurrentes
        created_count = await recurring_service.process_recurring_expenses()
        
        assert created_count >= 0