# backend/app/tasks/balance_reset_cron.py
"""
Script para ejecutar como tarea programada (cron job)
Ejecutar diariamente a las 00:00 para verificar y resetear balances
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.balance_service import BalanceService
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database

async def main():
    """Función principal para verificar y resetear balances"""
    print("🔄 Iniciando verificación de balances...")
    
    # Conectar a MongoDB
    await connect_to_mongo()
    
    try:
        # Obtener base de datos
        db = await get_database()
        
        # Inicializar servicio de balance
        balance_service = BalanceService(db)
        
        # Verificar y resetear balances
        result = await balance_service.check_and_reset_all_users()
        
        if result.get("success"):
            print(f"✅ Proceso completado:")
            print(f"   - Usuarios reseteados: {result['reset_count']}")
            print(f"   - Total usuarios: {result['total_users']}")
            
            if result.get("errors"):
                print(f"⚠️ Errores encontrados: {len(result['errors'])}")
                for error in result["errors"]:
                    print(f"   - Usuario {error['user_id']}: {error['error']}")
        else:
            print(f"❌ Error en el proceso: {result.get('message')}")
        
    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")
        raise
    
    finally:
        # Cerrar conexión
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())