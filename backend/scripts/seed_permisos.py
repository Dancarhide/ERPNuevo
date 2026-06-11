import asyncio
import os
import sys

# Ajustar el path para que encuentre "app"
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select

from app.core.database import SessionLocal
from app.models.seguridad import Permiso, Recurso

# Diccionario maestro de todos los permisos del ERP
MODULOS_PERMISOS = {
    "Empleados": {
        "ver_empleados": "Ver lista de empleados",
        "crear_empleado": "Dar de alta un nuevo empleado",
        "editar_empleado": "Modificar datos de un empleado",
        "eliminar_empleado": "Dar de baja o eliminar un empleado",
    },
    "Vacaciones": {
        "ver_vacaciones": "Ver solicitudes de vacaciones",
        "solicitar_vacaciones": "Crear una solicitud de vacaciones",
        "aprobar_vacaciones": "Aprobar o rechazar solicitudes",
    },
    "Asistencia": {
        "ver_asistencia": "Ver registros de asistencia",
        "modificar_asistencia": "Modificar horas o justificar faltas",
    },
    "Configuracion": {
        "ver_configuracion": "Ver panel de configuración (Roles, Áreas, Puestos)",
        "gestionar_roles": "Crear, editar o eliminar Roles",
        "gestionar_areas": "Administrar el catálogo de Áreas",
        "gestionar_puestos": "Administrar el catálogo de Puestos",
        "asignar_permisos": "Asignar permisos a roles o usuarios específicos",
        "configurar_empresa": "Configurar identidad y Misión/Visión de la empresa",
    },
    "Incidencias": {
        "ver_incidencias": "Ver lista de incidencias",
        "crear_incidencias": "Levantar incidencias a otros empleados",
        "gestionar_incidencias": "Cambiar estatus o eliminar incidencias",
    },
    "Nomina": {
        "ver_nomina": "Ver lista de nóminas de la empresa",
        "gestionar_nomina": "Crear y procesar lotes de nómina",
    },
    "Evaluaciones": {
        "ver_evaluaciones": "Ver el módulo de evaluaciones",
        "configurar_evaluaciones": "Crear y eliminar preguntas de evaluación",
        "ver_resultados_evaluaciones": "Ver resultados de desempeño de otros empleados",
    },
}


async def seed_permisos():
    async with SessionLocal() as session:
        print("=> Sincronizando catálogo de Recursos y Permisos...")

        for modulo_nombre, permisos_dict in MODULOS_PERMISOS.items():
            # 1. Buscar o crear el Recurso
            slug_recurso = modulo_nombre.lower().replace(" ", "_")
            result = await session.execute(select(Recurso).where(Recurso.clave == slug_recurso))
            recurso = result.scalar_one_or_none()

            if not recurso:
                recurso = Recurso(clave=slug_recurso, nombre=modulo_nombre)
                session.add(recurso)
                await session.flush()  # Obtener ID
                print(f"  [NUEVO] Recurso: {modulo_nombre}")

            # 2. Sincronizar Permisos para ese Recurso
            for accion_slug, nombre_descriptivo in permisos_dict.items():
                res_perm = await session.execute(select(Permiso).where(Permiso.slug == accion_slug))
                permiso = res_perm.scalar_one_or_none()

                if not permiso:
                    permiso = Permiso(
                        recurso_id=recurso.id,
                        accion=accion_slug.split("_")[0],  # ej. "ver", "crear"
                        slug=accion_slug,
                        nombre=nombre_descriptivo,
                    )
                    session.add(permiso)
                    print(f"    + Permiso: {accion_slug}")
                else:
                    # Actualizar nombre por si cambió en el código
                    if permiso.nombre != nombre_descriptivo:
                        permiso.nombre = nombre_descriptivo
                        session.add(permiso)

        await session.flush()

        # Asegurar que el rol Superadmin tenga todos los permisos
        from app.models.seguridad import Rol, RolPermiso

        result_rol = await session.execute(select(Rol).where(Rol.nombre_rol == "Superadmin"))
        superadmin = result_rol.scalar_one_or_none()

        if superadmin:
            print("=> Asignando permisos faltantes al rol Superadmin...")
            result_all_perms = await session.execute(select(Permiso))
            all_perms = result_all_perms.scalars().all()

            result_current_rp = await session.execute(
                select(RolPermiso).where(RolPermiso.rol_id == superadmin.id)
            )
            current_rp = {rp.permiso_id for rp in result_current_rp.scalars().all()}

            for p in all_perms:
                if p.id not in current_rp:
                    session.add(RolPermiso(rol_id=superadmin.id, permiso_id=p.id))
                    print(f"    + Asignado permiso {p.slug} a Superadmin")

        await session.commit()
        print("=> ¡Sincronización terminada exitosamente!")


if __name__ == "__main__":
    asyncio.run(seed_permisos())
