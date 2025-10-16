# Expense Tracker Backend

Backend API para el sistema de seguimiento de gastos desarrollado con FastAPI y MongoDB.

## 🏗️ Estructura del Proyecto

```
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                    # Punto de entrada de la aplicación
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py            # Configuración y variables de entorno
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   └── mongodb.py             # Conexión a MongoDB
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # Modelo de Usuario
│   │   └── expense.py             # Modelo de Gasto/Ingreso
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                # Schemas Pydantic para User
│   │   └── expense.py             # Schemas Pydantic para Expense
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                # Rutas de autenticación
│   │   ├── expenses.py            # Rutas de gastos/ingresos
│   │   └── websocket.py           # WebSocket para tiempo real
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py        # Lógica de autenticación
│   │   └── expense_service.py     # Lógica de gastos
│   │
│   └── utils/
│       ├── __init__.py
│       ├── security.py            # JWT, hashing, etc.
│       └── dependencies.py        # Dependencias de FastAPI
│
├── .env                           # Variables de entorno
├── requirements.txt               # Dependencias Python
├── setup.sh                      # Script de configuración
└── README.md                      # Documentación
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Python 3.8 o superior
- MongoDB (local o remoto)
- pip (gestor de paquetes de Python)

### Configuración Rápida

1. **Ejecutar el script de configuración:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Activar el entorno virtual:**
   ```bash
   source venv/bin/activate
   ```

3. **Configurar variables de entorno:**
   Edita el archivo `.env` con tu configuración de MongoDB:
   ```env
   MONGODB_URL=mongodb://admin:admin123@192.168.1.115:27017/
   SECRET_KEY=tu-clave-secreta-super-segura
   ```

4. **Ejecutar el servidor:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Configuración Manual

Si prefieres configurar manualmente:

```bash
# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Ejecutar servidor
uvicorn app.main:app --reload
```

## 📚 API Endpoints

### Autenticación

- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener información del usuario actual
- `POST /auth/logout` - Cerrar sesión

### Gastos

- `GET /expenses` - Obtener lista de gastos (con filtros)
- `GET /expenses/{id}` - Obtener gasto específico
- `POST /expenses` - Crear nuevo gasto
- `PUT /expenses/{id}` - Actualizar gasto
- `DELETE /expenses/{id}` - Eliminar gasto

### Estadísticas

- `GET /expenses/stats/summary` - Resumen estadístico
- `GET /expenses/stats/by-category` - Gastos agrupados por categoría

### WebSocket

- `WS /ws/expenses` - Conexión WebSocket para actualizaciones en tiempo real

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Registro/Login:** Obtén un token JWT
2. **Requests autenticados:** Incluye el token en el header:
   ```
   Authorization: Bearer <tu-jwt-token>
   ```
3. **WebSocket:** Pasa el token como query parameter:
   ```
   ws://localhost:8000/ws/expenses?token=<tu-jwt-token>
   ```

## 🌐 URLs Disponibles

- **API Base:** http://localhost:8000
- **Documentación Swagger:** http://localhost:8000/docs
- **Documentación ReDoc:** http://localhost:8000/redoc
- **WebSocket:** ws://localhost:8000/ws/expenses

## 📊 Características

### ✅ Implementado

- ✅ Autenticación JWT
- ✅ CRUD completo de gastos
- ✅ Filtros y paginación
- ✅ Estadísticas de gastos
- ✅ WebSocket para tiempo real
- ✅ Validación de datos con Pydantic
- ✅ Documentación automática
- ✅ CORS configurado
- ✅ Índices de base de datos
- ✅ Manejo de errores
- ✅ Estructura escalable

### 🔄 WebSocket en Tiempo Real

El WebSocket permite:

- Notificaciones de nuevos gastos
- Actualizaciones de gastos existentes
- Eliminación de gastos
- Estadísticas en tiempo real
- Ping/Pong para mantener conexión

## 🛠️ Desarrollo

### Estructura de Código

- **Models:** Definiciones de datos para MongoDB
- **Schemas:** Validación y serialización con Pydantic
- **Services:** Lógica de negocio
- **Routes:** Endpoints de la API
- **Utils:** Utilidades (seguridad, dependencias)

### Agregar Nuevas Funcionalidades

1. **Modelo:** Define en `models/`
2. **Schema:** Crea schemas en `schemas/`
3. **Service:** Implementa lógica en `services/`
4. **Route:** Crea endpoints en `routes/`
5. **Registra:** Incluye en `main.py`

## 🐳 Docker (Opcional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🧪 Testing

```bash
# Instalar dependencias de testing
pip install pytest pytest-asyncio httpx

# Ejecutar tests
pytest
```

## 📝 Variables de Entorno

```env
# Aplicación
APP_NAME=Expense Tracker API
APP_VERSION=1.0.0
DEBUG=true

# Seguridad
SECRET_KEY=tu-clave-secreta-super-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Base de datos
MONGODB_URL=mongodb://admin:admin123@192.168.1.115:27017/
DATABASE_NAME=expense_tracker

# Servidor
HOST=0.0.0.0
PORT=8000
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación en `/docs`
2. Verifica la configuración de MongoDB
3. Revisa los logs del servidor
4. Abre un issue en el repositorio
