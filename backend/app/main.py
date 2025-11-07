from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio

from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.routes import auth, expenses
from app.routes.websocket import websocket_endpoint
from app.config.settings import get_settings
from app.services.recurring_service import RecurringService
from app.services.balance_service import BalanceService


# 🔁 Función que se ejecutará automáticamente para procesar gastos recurrentes
async def ejecutar_recurrencias():
    print("🔄 Procesando gastos recurrentes automáticamente...")
    service = RecurringService()
    await service.process_recurring_expenses()


# 💰 Función que se ejecutará automáticamente para verificar y resetear balances
async def verificar_balances():
    print("💰 Verificando y reseteando balances de usuarios...")
    try:
        db = await get_database()
        balance_service = BalanceService(db)
        result = await balance_service.check_and_reset_all_users()
        
        if result.get("success"):
            print(f"✅ Balances verificados: {result['reset_count']} usuarios reseteados de {result['total_users']}")
        else:
            print(f"⚠️ Error verificando balances: {result.get('message')}")
    except Exception as e:
        print(f"❌ Error en verificación de balances: {e}")


# ✅ Manejo del ciclo de vida de la app
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Iniciando servidor FastAPI...")
    await connect_to_mongo()

    # Iniciar scheduler
    scheduler = AsyncIOScheduler()
    
    # Tarea: Procesar gastos recurrentes cada día a medianoche
    scheduler.add_job(ejecutar_recurrencias, "cron", hour=0, minute=0)
    
    # Tarea: Verificar y resetear balances cada día a las 00:01
    scheduler.add_job(verificar_balances, "cron", hour=0, minute=1)
    
    scheduler.start()
    print("✅ Scheduler iniciado.")
    print("   📅 Gastos recurrentes: todos los días a las 00:00")
    print("   💰 Verificación de balances: todos los días a las 00:01")

    # 🔧 Ejecutar al inicio para probar (opcional)
    # await ejecutar_recurrencias()
    # await verificar_balances()

    yield  # La app se mantiene corriendo

    # Shutdown
    print("🛑 Cerrando servidor...")
    await close_mongo_connection()
    scheduler.shutdown()
    print("🕒 Scheduler detenido.")


# Crear app FastAPI
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    description="API para el sistema de seguimiento de gastos con FastAPI y MongoDB",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(expenses.router)

# WebSocket endpoint
@app.websocket("/ws/expenses")
async def websocket_route(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for real-time expense updates"""
    await websocket_endpoint(websocket, token)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "websocket": "/ws/expenses",
        "endpoints": {
            "auth": "/auth",
            "expenses": "/expenses"
        }
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "message": "API is running",
        "version": settings.app_version
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )