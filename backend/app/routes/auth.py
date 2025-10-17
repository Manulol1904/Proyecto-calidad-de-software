from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin
from app.models.user import User
from app.services.auth_service import AuthService
from app.utils.security import create_access_token
from app.utils.dependencies import get_current_active_user
from app.config.settings import get_settings

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    auth_service = AuthService()
    
    try:
        user = await auth_service.create_user(user_data)
        return UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
            income=user.income or 0.0  # 👈 agregado
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """Login user and return access token"""
    auth_service = AuthService()
    settings = get_settings()
    
    user = await auth_service.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # 👇 devolvemos también los datos del usuario (con income incluido)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "income": getattr(user, "income", 0.0)
        }
    }


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        income=getattr(current_user, "income", 0.0)  # 👈 agregado
    )


@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Successfully logged out"}
