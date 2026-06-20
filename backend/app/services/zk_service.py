import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.checador import DispositivoBiometrico

logger = logging.getLogger(__name__)


async def sync_device_attendance(session: AsyncSession, dispositivo: DispositivoBiometrico) -> None:
    """
    Se conecta al dispositivo ZKTeco vía IP local (PULL_IP), descarga el historial de checadas
    desde la última vez, y lo procesa en la base de datos.
    """
    logger.info(
        f"Intentando sincronizar dispositivo {dispositivo.nombre} ({dispositivo.ip_address})"
    )

    try:
        from zk import ZK

        # Conexión real usando la librería instalada pyzk
        zk_client = ZK(
            dispositivo.ip_address,
            port=dispositivo.puerto or 4370,
            timeout=5,
            password=0,
            force_udp=False,
            ommit_ping=False,
        )

        conn = None
        try:
            conn = zk_client.connect()
            conn.disable_device()

            # Obtener checadas
            attendances = conn.get_attendance()

            # TODO: Idealmente habría que filtrar las checadas por fecha para no re-insertar
            # Pero como esto es una prueba real, vamos a loguearlo.
            from app.api.routes.asistencias import procesar_checada
            from app.models.asistencia import RegistroChecador

            nuevos_registros = 0
            for att in attendances:
                # El user_id en ZKTeco suele ser numérico o string.
                # Se debe mapear con el id de empleado
                try:
                    emp_id = int(att.user_id)
                except ValueError:
                    continue  # Skip si no es numérico

                ts = att.timestamp

                # Checar si ya existe el registro crudo para evitar duplicados en RegistroChecador
                # (Asumiendo que el dispositivo manda todo desde el inicio si no lo limpiamos)
                result = await session.execute(
                    select(RegistroChecador).where(
                        RegistroChecador.empleado_id == emp_id,
                        RegistroChecador.timestamp_checada == ts,
                    )
                )
                if result.scalar_one_or_none():
                    continue  # Ya existe

                new_reg = RegistroChecador(
                    empleado_id=emp_id,
                    timestamp_checada=ts,
                    metodo="Biometrico Local",
                    procesado=True,
                )
                session.add(new_reg)
                await session.flush()  # Para obtener ID si es necesario

                # Procesar consolidación diaria
                await procesar_checada(session, emp_id, ts)
                nuevos_registros += 1

            if len(attendances) > 0:
                conn.clear_attendance()
                logger.info("Memoria de asistencias del dispositivo limpiada correctamente.")

            logger.info(
                f"[REAL] Se conectó a {dispositivo.ip_address} y se leyeron {len(attendances)} asistencias ({nuevos_registros} procesables y nuevas)."  # noqa: E501
            )

        except Exception as conn_e:
            logger.error(
                f"Error en comunicación con dispositivo {dispositivo.ip_address}: {conn_e}"
            )
        finally:
            if conn:
                conn.enable_device()
                conn.disconnect()

        # Actualizamos la última sincronización en caso de éxito
        dispositivo.ultima_sincronizacion = datetime.now()  # type: ignore
        session.add(dispositivo)
        await session.commit()

    except ImportError:
        logger.error("La librería pyzk no está instalada.")
    except Exception as e:
        logger.error(f"Error general sincronizando {dispositivo.nombre}: {e}")
