# backend/app/tasks/recurring_cron.py
"""
Script para ejecutar como tarea programada (cron job)
Ejecutar diariamente a las 00:00 para procesar gastos recurrentes
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.recurring_service import RecurringService
from app.database.mongodb import connect_to_mongo, close_mongo_connection

async def main():
    """Función principal para procesar gastos recurrentes"""
    print("🔄 Iniciando procesamiento de gastos recurrentes...")
    
    # Conectar a MongoDB
    await connect_to_mongo()
    
    try:
        # Procesar gastos recurrentes
        recurring_service = RecurringService()
        created_count = await recurring_service.process_recurring_expenses()
        
        print(f"✅ Proceso completado: {created_count} gastos creados")
        
    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")
        raise
    
    finally:
        # Cerrar conexión
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())