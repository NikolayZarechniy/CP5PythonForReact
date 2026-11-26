from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI(title="Чат в реальном времени")


def now() -> str:
    """Текущее время в формате ЧЧ:ММ:СС."""
    return datetime.now().strftime("%H:%M:%S")


class ConnectionManager:
    """Хранит активные соединения: имя пользователя -> WebSocket."""

    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.active[username] = websocket

    def disconnect(self, username: str):
        self.active.pop(username, None)

    async def broadcast(self, message: dict):
        """Отправляет сообщение всем активным клиентам."""
        for username, websocket in list(self.active.items()):
            try:
                await websocket.send_json(message)
            except Exception:
                # клиент уже отключился — просто убираем его
                self.disconnect(username)


manager = ConnectionManager()


def system_message(text: str) -> dict:
    return {
        "type": "system",
        "username": "system",
        "text": text,
        "timestamp": now(),
    }


@app.websocket("/ws/{username}")
async def chat(websocket: WebSocket, username: str):
    await manager.connect(username, websocket)
    await manager.broadcast(system_message(f"{username} подключился к чату"))

    try:
        while True:
            data = await websocket.receive_json()
            text = str(data.get("text", "")).strip()
            if not text:
                continue

            await manager.broadcast(
                {
                    "type": "message",
                    "username": username,
                    "text": text,
                    "timestamp": now(),
                }
            )
    except WebSocketDisconnect:
        manager.disconnect(username)
        await manager.broadcast(system_message(f"{username} покинул чат"))
