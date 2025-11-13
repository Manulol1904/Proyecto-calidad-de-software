import pytest
from httpx import AsyncClient
from datetime import datetime
from app.main import app

@pytest.fixture
def user_data():
    """Crea un usuario único para cada test"""
    ts = int(datetime.utcnow().timestamp())
    return {
        "email": f"user_{ts}@example.com",
        "password": "TestPassword123",
        "username": f"user_{ts}",
        "full_name": "Test User",
        "income": 3000000,
        "income_type": "monthly"
    }

@pytest.fixture
async def auth_client(user_data):
    """Crea cliente autenticado para pruebas"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Registrar usuario
        res = await client.post("/auth/register", json=user_data)
        assert res.status_code == 201

        # Login
        login = await client.post("/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        assert login.status_code == 200
        token = login.json()["access_token"]
        client.headers.update({"Authorization": f"Bearer {token}"})
        yield client, user_data


# ----------------------------
# TESTS DE REGISTRO
# ----------------------------
class TestRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, user_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            res = await client.post("/auth/register", json=user_data)
            assert res.status_code == 201
            data = res.json()
            assert data["email"] == user_data["email"]
            assert data["username"] == user_data["username"]
            assert "id" in data
            assert "income" in data
            assert data["income_type"] == user_data["income_type"]

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, user_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/auth/register", json=user_data)
            res = await client.post("/auth/register", json=user_data)
            assert res.status_code == 400
            assert "already" in res.json()["detail"].lower() or "registrado" in res.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_invalid_email_format(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            res = await client.post("/auth/register", json={
                "email": "notanemail",
                "password": "TestPassword123"
            })
            assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_short_password(self, user_data):
        user_data["password"] = "12"
        async with AsyncClient(app=app, base_url="http://test") as client:
            res = await client.post("/auth/register", json=user_data)
            assert res.status_code == 422


# ----------------------------
# TESTS DE LOGIN
# ----------------------------
class TestLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, user_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/auth/register", json=user_data)
            res = await client.post("/auth/login", json={
                "email": user_data["email"],
                "password": user_data["password"]
            })
            assert res.status_code == 200
            data = res.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "user" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, user_data):
        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/auth/register", json=user_data)
            res = await client.post("/auth/login", json={
                "email": user_data["email"],
                "password": "WrongPassword"
            })
            assert res.status_code == 401
            assert "incorrect" in res.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            res = await client.post("/auth/login", json={
                "email": "ghost@example.com",
                "password": "whatever"
            })
            assert res.status_code == 401


# ----------------------------
# TESTS DE PERFIL /auth/me
# ----------------------------
class TestProfile:
    @pytest.mark.asyncio
    async def test_get_me(self, auth_client):
        client, user_data = auth_client
        res = await client.get("/auth/me")
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == user_data["email"]
        assert "income" in data
        assert "income_type" in data

    @pytest.mark.asyncio
    async def test_update_me(self, auth_client):
        client, _ = auth_client
        update = {
            "full_name": "Updated User",
            "income": 4000000,
            "income_type": "biweekly"
        }
        res = await client.put("/auth/me", json=update)
        assert res.status_code == 200
        data = res.json()
        assert data["full_name"] == "Updated User"
        assert data["income"] == 4000000
        assert data["income_type"] == "biweekly"

    @pytest.mark.asyncio
    async def test_get_current_income(self, auth_client):
        client, _ = auth_client
        res = await client.get("/auth/me/current-income")
        assert res.status_code == 200
        data = res.json()
        assert "current_available_income" in data
        assert "income_type" in data
        assert "next_reset_date" in data


# ----------------------------
# TESTS DE CONTRASEÑA
# ----------------------------
class TestPassword:
    @pytest.mark.asyncio
    async def test_change_password_success(self, auth_client):
        client, user_data = auth_client
        res = await client.post("/auth/me/change-password", json={
            "old_password": user_data["password"],
            "new_password": "NewSecurePassword123"
        })
        assert res.status_code == 200
        assert "actualizada" in res.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_change_password_wrong_old(self, auth_client):
        client, _ = auth_client
        res = await client.post("/auth/me/change-password", json={
            "old_password": "wrong",
            "new_password": "AnotherPassword"
        })
        assert res.status_code == 400
        assert "incorrecta" in res.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_forgot_password_success(self, auth_client):
        client, user_data = auth_client
        res = await client.post("/auth/forgot-password", json={"email": user_data["email"]})
        assert res.status_code == 200
        assert "enlace" in res.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            res = await client.post("/auth/forgot-password", json={"email": "nope@example.com"})
            assert res.status_code == 404
            assert "correo" in res.json()["detail"].lower()


# ----------------------------
# TESTS DE LOGOUT
# ----------------------------
class TestLogout:
    @pytest.mark.asyncio
    async def test_logout(self, auth_client):
        client, _ = auth_client
        res = await client.post("/auth/logout")
        assert res.status_code == 200
        assert "success" in res.json()["message"].lower()
