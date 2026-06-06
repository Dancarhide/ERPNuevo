import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.future import select

from app.core.database import SessionLocal
from app.models.checador import DispositivoBiometrico
from app.services.zk_service import sync_device_attendance

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def job_sync_dispositivos() -> None:
    """
    Tarea programada que busca todos los dispositivos configurados en modo PULL_IP
    y ejecuta su sincronización.
    """
    logger.info("Iniciando tarea programada: Sincronización de Biométricos")
    async with SessionLocal() as session:
        result = await session.execute(
            select(DispositivoBiometrico).where(
                DispositivoBiometrico.metodo_conexion == "PULL_IP",
                DispositivoBiometrico.activo,
            )
        )
        dispositivos = result.scalars().all()

        for disp in dispositivos:
            await sync_device_attendance(session, disp)

    logger.info("Tarea programada finalizada.")


def start_scheduler() -> None:
    # Ejecutar la sincronización cada 15 minutos
    scheduler.add_job(job_sync_dispositivos, "interval", minutes=15)
    scheduler.start()
    logger.info("Scheduler de tareas en segundo plano iniciado.")
