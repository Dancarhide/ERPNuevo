import asyncio
import os
import sys
from datetime import date, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.incidencia import Incidencia
from sqlalchemy.future import select

from app.models.asistencia import Asistencia
from app.models.empleados import Empleado


async def procesar_faltas(fecha: date):
    """
    Verifica los empleados activos y si no tienen asistencia registrada en la fecha,
    se les genera una incidencia de Falta.
    """
    print(f"Procesando faltas para la fecha: {fecha}")
    async with SessionLocal() as session:
        # 1. Obtener todos los empleados activos
        res_emp = await session.execute(select(Empleado).where(Empleado.estatus == "Activo"))
        empleados = res_emp.scalars().all()

        faltas_creadas = 0

        for emp in empleados:
            # TODO: Idealmente aquí se verificaría el calendario laboral y los días de descanso
            # Por simplicidad asumiremos que si es Lunes-Viernes se procesa
            if fecha.weekday() >= 5:  # 5 es Sábado, 6 es Domingo
                continue

            # Buscar asistencia
            res_asist = await session.execute(
                select(Asistencia).where(
                    Asistencia.empleado_id == emp.id, Asistencia.fecha == fecha
                )
            )
            asistencia = res_asist.scalar_one_or_none()

            # Si no hay asistencia
            if not asistencia:
                # Verificar que no tenga ya una incidencia justificada
                # (vacaciones, incapacidad, etc.)
                res_inc = await session.execute(
                    select(Incidencia).where(
                        Incidencia.empleado_id == emp.id, Incidencia.fecha_incidencia == fecha
                    )
                )
                incidencias = res_inc.scalars().all()
                if not incidencias:
                    # Crear Falta
                    nueva_falta = Incidencia(
                        empleado_id=emp.id,
                        tipo="Falta",
                        fecha_incidencia=fecha,
                        estado="Aprobada",
                        descripcion="Falta generada automáticamente por inasistencia.",
                        creada_por="Sistema",
                    )
                    session.add(nueva_falta)
                    faltas_creadas += 1

        await session.commit()
        print(f"Proceso finalizado. Se generaron {faltas_creadas} faltas automáticas.")


if __name__ == "__main__":
    # Si no se pasa fecha, toma el día anterior
    fecha_ayer = date.today() - timedelta(days=1)
    asyncio.run(procesar_faltas(fecha_ayer))
