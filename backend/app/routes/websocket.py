from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from typing import List, Dict
import json
import asyncio
from app.utils.security import get_user_email_from_token
from app.services.auth_service import AuthService
from app.services.expense_service import ExpenseService
from app.schemas.expense import WebSocketMessage

class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        # Dictionary to store active connections by user_id
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user to WebSocket"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"🔌 Usuario {user_id} conectado via WebSocket")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a user from WebSocket"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"🔌 Usuario {user_id} desconectado via WebSocket")

    async def send_personal_message(self, message: str, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove broken connections
                    if connection in self.active_connections[user_id]:
                        self.active_connections[user_id].remove(connection)

    async def broadcast_to_user(self, user_id: str, message_type: str, data: dict):
        """Broadcast message to specific user"""
        message = json.dumps({
            "type": message_type,
            "payload": data
        })
        await self.send_personal_message(message, user_id)

# Global connection manager
manager = ConnectionManager()

async def get_user_from_token(token: str) -> str:
    """Extract user ID from JWT token"""
    try:
        email = get_user_email_from_token(token)
        auth_service = AuthService()
        user = await auth_service.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return str(user.id)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for real-time updates"""
    if not token:
        await websocket.close(code=1008, reason="No token provided")
        return
    
    try:
        user_id = await get_user_from_token(token)
        await manager.connect(websocket, user_id)
        
        # Send welcome message
        await manager.broadcast_to_user(user_id, "connection", {
            "message": "Conectado al servidor de tiempo real",
            "user_id": user_id
        })
        
        while True:
            # Keep connection alive and handle incoming messages
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different message types
                if message_data.get("type") == "ping":
                    await manager.broadcast_to_user(user_id, "pong", {
                        "timestamp": message_data.get("timestamp")
                    })
                elif message_data.get("type") == "get_stats":
                    # Send current expense statistics
                    expense_service = ExpenseService()
                    stats = await expense_service.get_expense_stats(user_id)
                    await manager.broadcast_to_user(user_id, "stats", stats)
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await manager.broadcast_to_user(user_id, "error", {
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                print(f"Error in WebSocket: {e}")
                break
                
    except HTTPException as e:
        await websocket.close(code=1008, reason=str(e.detail))
    except Exception as e:
        await websocket.close(code=1011, reason="Internal server error")
    finally:
        if 'user_id' in locals():
            manager.disconnect(websocket, user_id)

# Functions to broadcast expense updates
async def broadcast_expense_update(user_id: str, expense_data: dict, action: str):
    """Broadcast expense update to user's WebSocket connections"""
    await manager.broadcast_to_user(user_id, f"expense_{action}", expense_data)

async def broadcast_new_expense(user_id: str, expense_data: dict):
    """Broadcast new expense to user's WebSocket connections"""
    await manager.broadcast_to_user(user_id, "new_expense", expense_data)

async def broadcast_expense_deletion(user_id: str, expense_id: str):
    """Broadcast expense deletion to user's WebSocket connections"""
    await manager.broadcast_to_user(user_id, "expense_deleted", {
        "expense_id": expense_id
    })

# Export the websocket endpoint function
__all__ = ["websocket_endpoint", "broadcast_new_expense", "broadcast_expense_update", "broadcast_expense_deletion"]
