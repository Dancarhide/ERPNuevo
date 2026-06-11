import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import SessionLocal
from app.main import app
from app.models.empleados import Empleado


async def main():
    async with SessionLocal() as session:
        result = await session.execute(select(Empleado).limit(1))
        user = result.scalar_one_or_none()

    if not user:
        print("No users found.")
        return

    app.dependency_overrides[get_current_user] = lambda: user
    client = TestClient(app)

    try:
        response = client.get("/api/notificaciones")
        print("Status:", response.status_code)
        print("Response:", response.text)
    except Exception as e:
        print("EXCEPTION:", e)


if __name__ == "__main__":
    asyncio.run(main())
