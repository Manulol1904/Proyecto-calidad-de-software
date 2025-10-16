#!/bin/bash

# Script para configurar el entorno del backend FastAPI + MongoDB

echo "🚀 Configurando el backend de FastAPI con MongoDB..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado. Por favor instala Python 3.8+"
    exit 1
fi

# Verificar versión de Python
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Se requiere Python 3.8 o superior. Versión actual: $python_version"
    exit 1
fi

# Crear entorno virtual
echo "📦 Creando entorno virtual..."
python3 -m venv venv

# Activar entorno virtual
echo "🔧 Activando entorno virtual..."
source venv/bin/activate

# Actualizar pip
echo "⬆️ Actualizando pip..."
pip install --upgrade pip

# Instalar dependencias
echo "📚 Instalando dependencias..."
pip install -r requirements.txt

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "⚙️ Creando archivo .env..."
    cat > .env << EOF
# Application settings
APP_NAME=Expense Tracker API
APP_VERSION=1.0.0
DEBUG=true

# Security settings
SECRET_KEY=your-secret-key-change-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database settings
MONGODB_URL=mongodb://admin:admin123@192.168.1.115:27017/
DATABASE_NAME=expense_tracker

# Server settings
HOST=0.0.0.0
PORT=8000
EOF
    echo "✅ Archivo .env creado"
else
    echo "ℹ️ Archivo .env ya existe"
fi

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Para ejecutar el servidor:"
echo "1. source venv/bin/activate"
echo "2. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "🌐 URLs disponibles:"
echo "   - API: http://localhost:8000"
echo "   - Documentación: http://localhost:8000/docs"
echo "   - ReDoc: http://localhost:8000/redoc"
echo "   - WebSocket: ws://localhost:8000/ws/expenses"
echo ""
echo "🔧 Para configurar MongoDB:"
echo "   - Edita el archivo .env con tu URL de MongoDB"
echo "   - Asegúrate de que MongoDB esté corriendo"
echo ""
echo "📖 Endpoints principales:"
echo "   - POST /auth/register - Registrar usuario"
echo "   - POST /auth/login - Iniciar sesión"
echo "   - GET /auth/me - Obtener usuario actual"
echo "   - GET /expenses - Obtener gastos"
echo "   - POST /expenses - Crear gasto"
echo "   - PUT /expenses/{id} - Actualizar gasto"
echo "   - DELETE /expenses/{id} - Eliminar gasto"
echo "   - GET /expenses/stats/summary - Estadísticas de gastos"
echo "   - GET /expenses/stats/by-category - Gastos por categoría"
echo ""
echo "🔐 Autenticación:"
echo "   - Usa el token JWT en el header: Authorization: Bearer <token>"
echo "   - Para WebSocket, pasa el token como query parameter: ?token=<jwt_token>"
