from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin, UserUpdate
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.balance_service import BalanceService
from app.utils.security import create_access_token
from app.utils.dependencies import get_current_active_user
from app.config.settings import get_settings
from app.database.mongodb import get_collection
from fastapi import BackgroundTasks
from app.schemas.user import PasswordResetRequest
from app.utils.email_utils import send_reset_email 
from app.schemas.user import PasswordResetConfirm
import urllib.parse



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
            income=user.income or 0.0,
            income_type=user.income_type or "monthly",
            last_reset_date=user.last_reset_date,
            next_reset_date=user.next_reset_date
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login")
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
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "income": getattr(user, "income", 0.0),
            "income_type": getattr(user, "income_type", "monthly"),
            "last_reset_date": user.last_reset_date.isoformat() if user.last_reset_date else None,
            "next_reset_date": user.next_reset_date.isoformat() if user.next_reset_date else None
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
        income=getattr(current_user, "income", 0.0),
        income_type=getattr(current_user, "income_type", "monthly"),
        last_reset_date=current_user.last_reset_date,
        next_reset_date=current_user.next_reset_date
    )


@router.get("/me/current-income")
async def get_current_income(current_user: User = Depends(get_current_active_user)):
    """
    Obtiene el ingreso actual del usuario considerando el tipo de pago
    - Si es mensual: retorna el ingreso completo
    - Si es quincenal: retorna mitad antes del día 15, completo después
    """
    users_collection = await get_collection("users")
    db = users_collection.database
    balance_service = BalanceService(db)
    
    current_income = await balance_service.get_user_current_income(str(current_user.id))
    
    return {
        "user_id": str(current_user.id),
        "income_type": current_user.income_type,
        "total_income": current_user.income,
        "current_available_income": current_income,
        "next_reset_date": current_user.next_reset_date.isoformat() if current_user.next_reset_date else None
    }


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update current user profile"""
    auth_service = AuthService()
    
    updated_user = await auth_service.update_user(str(current_user.id), user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(updated_user.id),
        username=updated_user.username,
        email=updated_user.email,
        full_name=updated_user.full_name,
        is_active=updated_user.is_active,
        created_at=updated_user.created_at,
        income=getattr(updated_user, "income", 0.0),
        income_type=getattr(updated_user, "income_type", "monthly"),
        last_reset_date=updated_user.last_reset_date,
        next_reset_date=updated_user.next_reset_date
    )


@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Successfully logged out"}


@router.post("/admin/reset-balances")
async def reset_all_balances(current_user: User = Depends(get_current_active_user)):
    """
    Endpoint administrativo para forzar el reset de todos los usuarios
    (solo para pruebas o mantenimiento)
    """
    users_collection = await get_collection("users")
    db = users_collection.database
    balance_service = BalanceService(db)
    
    result = await balance_service.check_and_reset_all_users()
    
    return result

@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """
    Envía un correo con enlace para restablecer contraseña
    """
    email = request.email
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe un usuario con ese correo"
        )

    # Generar token de recuperación (válido por 1 hora)
    token = create_access_token({"sub": email}, expires_delta=timedelta(hours=1))
    encoded_token = urllib.parse.quote(token)
    reset_link = f"http://localhost:5173/reset-password?token={encoded_token}"

    # Enviar correo (simulado o real)
    try:
        await send_reset_email(email, reset_link)
    except Exception as e:
        print("⚠️ Error al enviar correo:", e)

    return {"message": "Se ha enviado un enlace para restablecer la contraseña."}



@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm):
    auth_service = AuthService()
    
    try:
        email = auth_service.verify_reset_token(data.token)
        print("Token válido para email:", email)
    except Exception as e:
        print("Error en verificación de token:", e)
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    await auth_service.update_password(email, data.new_password)
    return {"message": "Contraseña actualizada exitosamente"}
