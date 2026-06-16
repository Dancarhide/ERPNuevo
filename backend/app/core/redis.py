import redis.asyncio as redis

from app.core.config import settings


class RedisClient:
    def __init__(self):
        self.pool = None
        self.client = None

    async def connect(self):
        self.pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
        self.client = redis.Redis(connection_pool=self.pool)

    async def disconnect(self):
        if self.client:
            await self.client.close()
        if self.pool:
            await self.pool.disconnect()


redis_client = RedisClient()


async def get_redis():
    return redis_client.client
