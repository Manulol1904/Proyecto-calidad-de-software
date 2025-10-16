from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Expense Tracker API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Security settings
    secret_key: str = "your-secret-key-change-in-production-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Database settings
    mongodb_url: str = "mongodb://localhost:27017/"
    database_name: str = "expense_tracker"
    
    # CORS settings
    allowed_origins: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }

# Create settings instance
settings = Settings()

# Environment-specific configurations
def get_settings() -> Settings:
    """Get application settings"""
    return settings
