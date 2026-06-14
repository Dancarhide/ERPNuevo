"""seed_permisos_idempotente

Revision ID: 42610dae7cc3
Revises: 6935091f7587
Create Date: 2026-06-14 09:05:21.982679

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "42610dae7cc3"
down_revision: Union[str, Sequence[str], None] = "6935091f7587"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


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
        "editar_configuracion": "Editar parámetros fiscales y catálogo de nómina",
    },
    "Incidencias": {
        "ver_incidencias": "Ver lista de incidencias",
        "crear_incidencias": "Levantar incidencias a otros empleados",
        "gestionar_incidencias": "Cambiar estatus o eliminar incidencias",
    },
    "Nomina": {
        "ver_nomina": "Ver lista de nóminas de la empresa",
        "gestionar_nomina": "Crear y procesar lotes de nómina",
        "timbrar_nomina": "Timbrar recibos CFDI 4.0 ante el SAT",
    },
    "Evaluaciones": {
        "ver_evaluaciones": "Ver el módulo de evaluaciones",
        "configurar_evaluaciones": "Crear y eliminar preguntas de evaluación",
        "ver_resultados_evaluaciones": "Ver resultados de desempeño de otros empleados",
    },
    "Calendario": {
        "gestionar_calendario": "Crear, editar o eliminar eventos y días festivos en el calendario",
    },
}


def upgrade() -> None:
    # 1. Crear recursos de manera idempotente
    for modulo_nombre, permisos_dict in MODULOS_PERMISOS.items():
        slug_recurso = modulo_nombre.lower().replace(" ", "_")
        op.execute(f"""
        INSERT INTO recursos (clave, nombre, activo, creado_en, actualizado_en)
        VALUES ('{slug_recurso}', '{modulo_nombre}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (clave) DO UPDATE SET nombre = EXCLUDED.nombre;
        """)

        # 2. Crear permisos de manera idempotente
        for accion_slug, nombre_descriptivo in permisos_dict.items():
            accion = accion_slug.split("_")[0]
            op.execute(f"""
            INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en)
            VALUES ((SELECT id FROM recursos WHERE clave = '{slug_recurso}'), '{accion}', '{accion_slug}', '{nombre_descriptivo}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (slug) DO UPDATE SET nombre = EXCLUDED.nombre;
            """)

    # 3. Asegurar que existe el rol Superadmin
    op.execute("""
    INSERT INTO roles (nombre_rol, descripcion, es_sistema, nivel_jerarquia, creado_en, actualizado_en)
    SELECT 'Superadmin', 'Administrador Global del ERP', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'Superadmin');
    """)

    # 4. Asignar todos los permisos al rol Superadmin
    op.execute("""
    INSERT INTO rol_permisos (rol_id, permiso_id, alcance, activo, creado_en, actualizado_en)
    SELECT r.id, p.id, 'global', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM roles r
    CROSS JOIN permisos p
    WHERE r.nombre_rol = 'Superadmin'
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;
    """)


def downgrade() -> None:
    pass
