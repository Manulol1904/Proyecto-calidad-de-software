import pytest
from datetime import datetime, timedelta
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    get_user_email_from_token
)
from fastapi import HTTPException

class TestPasswordHashing:
    """Tests para hash de contraseñas"""
    
    def test_hash_password(self):
        """Test: Hashear contraseña"""
        password = "mysecretpassword"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")
    
    def test_verify_password_success(self):
        """Test: Verificar contraseña correcta"""
        password = "mysecretpassword"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_failure(self):
        """Test: Fallar verificación con contraseña incorrecta"""
        password = "mysecretpassword"
        hashed = get_password_hash(password)
        
        assert verify_password("wrongpassword", hashed) is False
    
    def test_different_hashes_same_password(self):
        """Test: Misma contraseña genera diferentes hashes"""
        password = "mysecretpassword"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True
    
    def test_long_password_truncation(self):
        """Test: Contraseñas largas se truncan a 72 caracteres"""
        long_password = "a" * 100
        hashed = get_password_hash(long_password)
        
        # Verificar con los primeros 72 caracteres
        assert verify_password("a" * 72, hashed) is True
        # Verificar con la contraseña completa también funciona
        assert verify_password(long_password, hashed) is True

class TestJWTTokens:
    """Tests para tokens JWT"""
    
    def test_create_token(self):
        """Test: Crear token JWT"""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_token_with_expiration(self):
        """Test: Crear token con expiración personalizada"""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta)
        
        assert token is not None
        
        # Verificar que el token puede ser decodificado
        payload = verify_token(token)
        assert payload["sub"] == "test@example.com"
        assert "exp" in payload
    
    def test_verify_valid_token(self):
        """Test: Verificar token válido"""
        data = {"sub": "test@example.com", "user_id": "123"}
        token = create_access_token(data)
        
        payload = verify_token(token)
        
        assert payload["sub"] == "test@example.com"
        assert payload["user_id"] == "123"
        assert "exp" in payload
    
    def test_verify_expired_token(self):
        """Test: Error al verificar token expirado"""
        data = {"sub": "test@example.com"}
        # Crear token que expira inmediatamente
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta)
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(token)
        
        assert exc_info.value.status_code == 401
    
    def test_verify_invalid_token(self):
        """Test: Error al verificar token inválido"""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(invalid_token)
        
        assert exc_info.value.status_code == 401
    
    def test_get_email_from_token(self):
        """Test: Extraer email de token"""
        email = "test@example.com"
        data = {"sub": email}
        token = create_access_token(data)
        
        extracted_email = get_user_email_from_token(token)
        
        assert extracted_email == email
    
    def test_get_email_from_token_no_subject(self):
        """Test: Error al extraer email de token sin subject"""
        data = {"user_id": "123"}  # No tiene 'sub'
        token = create_access_token(data)
        
        with pytest.raises(HTTPException) as exc_info:
            get_user_email_from_token(token)
        
        assert exc_info.value.status_code == 401
    
    def test_token_contains_expiration(self):
        """Test: Token contiene información de expiración"""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta)
        
        payload = verify_token(token)
        
        assert "exp" in payload
        # Verificar que la expiración está en el futuro
        exp_timestamp = payload["exp"]
        current_timestamp = datetime.utcnow().timestamp()
        assert exp_timestamp > current_timestamp

class TestSecurityEdgeCases:
    """Tests para casos extremos de seguridad"""
    
    def test_empty_password(self):
        """Test: Hashear contraseña vacía"""
        hashed = get_password_hash("")
        assert hashed is not None
        assert verify_password("", hashed) is True
    
    def test_special_characters_password(self):
        """Test: Contraseña con caracteres especiales"""
        password = "p@$$w0rd!#%&*()[]{}|<>?/.,;:'\"\\`~"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_unicode_password(self):
        """Test: Contraseña con caracteres Unicode"""
        password = "contraseña_ñ_México_北京_🔐"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_token_with_special_characters(self):
        """Test: Token con caracteres especiales en datos"""
        data = {
            "sub": "test+special@example.com",
            "name": "John O'Brien"
        }
        token = create_access_token(data)
        payload = verify_token(token)
        
        assert payload["sub"] == data["sub"]
        assert payload["name"] == data["name"]
    
    def test_multiple_token_verification(self):
        """Test: Verificar múltiples tokens"""
        tokens = []
        for i in range(5):
            data = {"sub": f"user{i}@example.com"}
            token = create_access_token(data)
            tokens.append(token)
        
        # Verificar todos los tokens
        for i, token in enumerate(tokens):
            payload = verify_token(token)
            assert payload["sub"] == f"user{i}@example.com"