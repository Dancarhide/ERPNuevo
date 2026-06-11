import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select

from app.core.database import SessionLocal
from app.models.comunicacion import Notificacion


async def test():
    try:
        async with SessionLocal() as session:
            result = await session.execute(select(Notificacion).limit(1))
            n = result.scalar_one_or_none()
            print(n)
            if n:
                print(n.creado_el)
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(test())
