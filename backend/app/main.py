from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routes import auth, expenses
from app.routes.websocket import websocket_endpoint
from app.config.settings import get_settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Iniciando servidor FastAPI...")
    await connect_to_mongo()
    yield
    # Shutdown
    print("🛑 Cerrando servidor...")
    await close_mongo_connection()

# Create FastAPI app
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

# Include routers
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
