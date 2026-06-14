import logging
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.future import select

from app.core.database import SessionLocal
from app.models.asistencia import Asistencia, Incidencia, Vacacion
from app.models.checador import DispositivoBiometrico
from app.models.empleados import Empleado
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


async def job_evaluar_faltas() -> None:
    """
    Se ejecuta al final del día. Revisa qué empleados no tuvieron asistencia
    y no están de vacaciones/permiso, para levantarles Falta Automática.
    """
    logger.info("Iniciando evaluación diaria de faltas automáticas...")
    hoy = date.today()

    async with SessionLocal() as session:
        # 1. Obtener empleados activos
        res_emp = await session.execute(select(Empleado).where(Empleado.activo))
        empleados = res_emp.scalars().all()

        # 2. Obtener asistencias de hoy
        res_asist = await session.execute(select(Asistencia).where(Asistencia.fecha == hoy))
        asistencias_hoy = {a.empleado_id for a in res_asist.scalars().all()}

        # 3. Obtener vacaciones aprobadas vigentes hoy
        res_vac = await session.execute(
            select(Vacacion).where(
                Vacacion.estatus_vacacion == "Aprobada",
                Vacacion.fecha_inicio <= hoy,
                Vacacion.fecha_fin >= hoy,
            )
        )
        vacaciones_hoy = {v.empleado_id for v in res_vac.scalars().all()}

        # 4. Obtener incidencias previas de hoy (para no duplicar o si ya tienen un permiso/falta)
        res_inc = await session.execute(
            select(Incidencia).where(Incidencia.fecha_incidencia == hoy)
        )
        incidencias_hoy = {i.empleado_reportado_id for i in res_inc.scalars().all()}

        nuevas_faltas = []
        for emp in empleados:
            # Si NO vino, NO está de vacaciones, y NO tiene incidencia ya registrada
            if (
                emp.id not in asistencias_hoy
                and emp.id not in vacaciones_hoy
                and emp.id not in incidencias_hoy
            ):
                falta = Incidencia(
                    empleado_reportado_id=emp.id,
                    titulo="Falta Automática",
                    tipo="Falta",
                    fecha_incidencia=hoy,
                    estatus="Aprobada",
                    descripcion="El sistema detectó ausencia del empleado durante toda la jornada laboral.",  # noqa: E501
                )
                session.add(falta)
                nuevas_faltas.append(falta)

        if nuevas_faltas:
            await session.commit()
            logger.info(f"Se generaron {len(nuevas_faltas)} faltas automáticas para el {hoy}.")
        else:
            logger.info("No se requirió generar ninguna falta automática hoy.")


def start_scheduler() -> None:
    # Ejecutar la sincronización de biométricos cada 15 minutos
    scheduler.add_job(job_sync_dispositivos, "interval", minutes=15)

    # Ejecutar la evaluación de faltas todos los días a las 23:50
    scheduler.add_job(job_evaluar_faltas, "cron", hour=23, minute=50)

    scheduler.start()
    logger.info("Scheduler de tareas en segundo plano iniciado.")
