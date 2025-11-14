import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta
from app.main import app
from bson import ObjectId

@pytest.fixture
async def authenticated_client():
    """Cliente autenticado para tests de gastos"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Registrar y autenticar usuario
        user_data = {
            "email": f"expense_test_{datetime.utcnow().timestamp()}@example.com",
            "password": "testpass123",
            "username": f"expenseuser_{int(datetime.utcnow().timestamp())}",
            "income": 5000000,
            "income_type": "monthly"
        }
        
        await client.post("/auth/register", json=user_data)
        login_response = await client.post("/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        
        token = login_response.json()["access_token"]
        client.headers.update({"Authorization": f"Bearer {token}"})
        
        yield client, user_data

@pytest.fixture
def sample_expense_data():
    """Datos de ejemplo para un gasto"""
    return {
        "title": "Comida en restaurante",
        "amount": 50000,
        "category": "Alimentación",
        "description": "Almuerzo con amigos",
        "date": datetime.utcnow().isoformat(),
        "type": "expense",
        "is_recurring": False
    }

@pytest.fixture
def sample_income_data():
    """Datos de ejemplo para un ingreso"""
    return {
        "title": "Salario",
        "amount": 3000000,
        "category": "Ingreso",
        "description": "Pago mensual",
        "date": datetime.utcnow().isoformat(),
        "type": "income",
        "is_recurring": False
    }

class TestExpenseCreation:
    """Tests para creación de gastos"""
    
    @pytest.mark.asyncio
    async def test_create_expense_success(self, authenticated_client, sample_expense_data):
        """Test: Crear gasto exitosamente"""
        client, _ = authenticated_client
        response = await client.post("/expenses/", json=sample_expense_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == sample_expense_data["title"]
        assert data["amount"] == sample_expense_data["amount"]
        assert data["category"] == sample_expense_data["category"]
        assert data["type"] == "expense"
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_create_income_success(self, authenticated_client, sample_income_data):
        """Test: Crear ingreso exitosamente"""
        client, _ = authenticated_client
        response = await client.post("/expenses/", json=sample_income_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "income"
        assert data["amount"] == sample_income_data["amount"]
    
    @pytest.mark.asyncio
    async def test_create_expense_without_auth(self, sample_expense_data):
        """Test: Error al crear gasto sin autenticación"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/expenses/", json=sample_expense_data)
            
            assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_create_expense_invalid_amount(self, authenticated_client):
        """Test: Error con monto negativo"""
        client, _ = authenticated_client
        response = await client.post("/expenses/", json={
            "title": "Test",
            "amount": -100,
            "category": "Test",
            "type": "expense"
        })
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_create_expense_missing_fields(self, authenticated_client):
        """Test: Error con campos faltantes"""
        client, _ = authenticated_client
        response = await client.post("/expenses/", json={
            "title": "Test"
        })
        
        assert response.status_code == 422

class TestExpenseRetrieval:
    """Tests para obtener gastos"""
    
    @pytest.mark.asyncio
    async def test_get_expenses_list(self, authenticated_client, sample_expense_data):
        """Test: Obtener lista de gastos"""
        client, _ = authenticated_client
        
        # Crear varios gastos
        for i in range(3):
            expense_data = sample_expense_data.copy()
            expense_data["title"] = f"Gasto {i+1}"
            await client.post("/expenses/", json=expense_data)
        
        # Obtener lista
        response = await client.get("/expenses/")
        
        assert response.status_code == 200
        data = response.json()
        assert "expenses" in data
        assert "total" in data
        assert data["total"] >= 3
        assert len(data["expenses"]) >= 3
    
    @pytest.mark.asyncio
    async def test_get_expenses_pagination(self, authenticated_client, sample_expense_data):
        """Test: Paginación de gastos"""
        client, _ = authenticated_client
        
        # Crear 10 gastos
        for i in range(10):
            expense_data = sample_expense_data.copy()
            expense_data["title"] = f"Gasto {i+1}"
            await client.post("/expenses/", json=expense_data)
        
        # Primera página
        response = await client.get("/expenses/?skip=0&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["expenses"]) == 5
        
        # Segunda página
        response = await client.get("/expenses/?skip=5&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["expenses"]) == 5
    
    @pytest.mark.asyncio
    async def test_get_expense_by_id(self, authenticated_client, sample_expense_data):
        """Test: Obtener gasto por ID"""
        client, _ = authenticated_client
        
        # Crear gasto
        create_response = await client.post("/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        
        # Obtener por ID
        response = await client.get(f"/expenses/{expense_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == expense_id
        assert data["title"] == sample_expense_data["title"]
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_expense(self, authenticated_client):
        """Test: Error al obtener gasto inexistente"""
        client, _ = authenticated_client
        fake_id = str(ObjectId())
        
        response = await client.get(f"/expenses/{fake_id}")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_filter_by_category(self, authenticated_client):
        """Test: Filtrar gastos por categoría"""
        client, _ = authenticated_client
        
        # Crear gastos de diferentes categorías
        await client.post("/expenses/", json={
            "title": "Comida",
            "amount": 50000,
            "category": "Alimentación",
            "type": "expense"
        })
        await client.post("/expenses/", json={
            "title": "Transporte",
            "amount": 20000,
            "category": "Transporte",
            "type": "expense"
        })
        
        # Filtrar por categoría
        response = await client.get("/expenses/?category=Alimentación")
        
        assert response.status_code == 200
        data = response.json()
        for expense in data["expenses"]:
            assert "Alimentación" in expense["category"]

class TestExpenseUpdate:
    """Tests para actualizar gastos"""
    
    @pytest.mark.asyncio
    async def test_update_expense_success(self, authenticated_client, sample_expense_data):
        """Test: Actualizar gasto exitosamente"""
        client, _ = authenticated_client
        
        # Crear gasto
        create_response = await client.post("/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        
        # Actualizar
        update_data = {
            "title": "Título actualizado",
            "amount": 75000,
            "category": "Nueva Categoría"
        }
        response = await client.put(f"/expenses/{expense_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["amount"] == update_data["amount"]
        assert data["category"] == update_data["category"]
    
    @pytest.mark.asyncio
    async def test_update_nonexistent_expense(self, authenticated_client):
        """Test: Error al actualizar gasto inexistente"""
        client, _ = authenticated_client
        fake_id = str(ObjectId())
        
        response = await client.put(f"/expenses/{fake_id}", json={
            "title": "Updated"
        })
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_partial_update(self, authenticated_client, sample_expense_data):
        """Test: Actualización parcial de gasto"""
        client, _ = authenticated_client
        
        # Crear gasto
        create_response = await client.post("/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        original_amount = create_response.json()["amount"]
        
        # Actualizar solo el título
        response = await client.put(f"/expenses/{expense_id}", json={
            "title": "Solo título actualizado"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Solo título actualizado"
        assert data["amount"] == original_amount  # No cambió

class TestExpenseDeletion:
    """Tests para eliminar gastos"""
    
    @pytest.mark.asyncio
    async def test_delete_expense_success(self, authenticated_client, sample_expense_data):
        """Test: Eliminar gasto exitosamente"""
        client, _ = authenticated_client
        
        # Crear gasto
        create_response = await client.post("/expenses/", json=sample_expense_data)
        expense_id = create_response.json()["id"]
        
        # Eliminar
        response = await client.delete(f"/expenses/{expense_id}")
        
        assert response.status_code == 204
        
        # Verificar que no existe
        get_response = await client.get(f"/expenses/{expense_id}")
        assert get_response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_delete_nonexistent_expense(self, authenticated_client):
        """Test: Error al eliminar gasto inexistente"""
        client, _ = authenticated_client
        fake_id = str(ObjectId())
        
        response = await client.delete(f"/expenses/{fake_id}")
        
        assert response.status_code == 404

class TestExpenseStatistics:
    """Tests para estadísticas de gastos"""
    
    @pytest.mark.asyncio
    async def test_get_expense_summary(self, authenticated_client):
        """Test: Obtener resumen de gastos"""
        client, _ = authenticated_client
        
        # Crear algunos gastos e ingresos
        await client.post("/expenses/", json={
            "title": "Gasto 1",
            "amount": 100000,
            "category": "Test",
            "type": "expense"
        })
        await client.post("/expenses/", json={
            "title": "Ingreso 1",
            "amount": 500000,
            "category": "Test",
            "type": "income"
        })
        
        # Obtener resumen
        response = await client.get("/expenses/stats/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert "income_total" in data
        assert "expense_total" in data
        assert "balance" in data
    
    @pytest.mark.asyncio
    async def test_get_expenses_by_category(self, authenticated_client):
        """Test: Obtener gastos agrupados por categoría"""
        client, _ = authenticated_client
        
        # Crear gastos en diferentes categorías
        await client.post("/expenses/", json={
            "title": "Comida 1",
            "amount": 50000,
            "category": "Alimentación",
            "type": "expense"
        })
        await client.post("/expenses/", json={
            "title": "Comida 2",
            "amount": 30000,
            "category": "Alimentación",
            "type": "expense"
        })
        await client.post("/expenses/", json={
            "title": "Bus",
            "amount": 5000,
            "category": "Transporte",
            "type": "expense"
        })
        
        # Obtener por categoría
        response = await client.get("/expenses/stats/by-category")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verificar que hay categorías
        categories = [item["category"] for item in data]
        assert "Alimentación" in categories or "alimentación" in categories

class TestRecurringExpenses:
    """Tests para gastos recurrentes"""
    
    @pytest.mark.asyncio
    async def test_create_recurring_expense(self, authenticated_client):
        """Test: Crear gasto recurrente"""
        client, _ = authenticated_client
        
        response = await client.post("/expenses/", json={
            "title": "Netflix",
            "amount": 45000,
            "category": "Suscripciones",
            "type": "expense",
            "is_recurring": True,
            "recurrence_day": 15
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_recurring"] is True
        assert data["recurrence_day"] == 15
    
    @pytest.mark.asyncio
    async def test_get_recurring_expenses(self, authenticated_client):
        """Test: Obtener gastos recurrentes"""
        client, _ = authenticated_client
        
        # Crear gasto recurrente
        await client.post("/expenses/", json={
            "title": "Netflix",
            "amount": 45000,
            "category": "Suscripciones",
            "type": "expense",
            "is_recurring": True,
            "recurrence_day": 15
        })
        
        # Obtener recurrentes
        response = await client.get("/expenses/recurring")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_process_recurring_expenses(self, authenticated_client):
        """Test: Procesar gastos recurrentes"""
        client, _ = authenticated_client
        
        response = await client.post("/expenses/recurring/process")
        
        assert response.status_code == 200
        data = response.json()
        assert "created" in data