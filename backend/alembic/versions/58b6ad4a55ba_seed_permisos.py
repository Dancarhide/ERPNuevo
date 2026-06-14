"""seed_permisos

Revision ID: 58b6ad4a55ba
Revises: b3c6731295a8
Create Date: 2026-06-06 01:03:24.465747

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "58b6ad4a55ba"
down_revision: Union[str, Sequence[str], None] = "b3c6731295a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insertar Recursos
    op.execute(
        "INSERT INTO recursos (clave, nombre, activo, creado_en, actualizado_en) VALUES ('empleados', 'Empleados', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO recursos (clave, nombre, activo, creado_en, actualizado_en) VALUES ('vacaciones', 'Vacaciones', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO recursos (clave, nombre, activo, creado_en, actualizado_en) VALUES ('asistencia', 'Asistencia', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO recursos (clave, nombre, activo, creado_en, actualizado_en) VALUES ('configuracion', 'Configuracion', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )

    # Insertar Permisos de Empleados
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'empleados'), 'ver', 'ver_empleados', 'Ver lista de empleados', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'empleados'), 'crear', 'crear_empleado', 'Dar de alta un nuevo empleado', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'empleados'), 'editar', 'editar_empleado', 'Modificar datos de un empleado', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'empleados'), 'eliminar', 'eliminar_empleado', 'Dar de baja o eliminar un empleado', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )

    # Insertar Permisos de Vacaciones
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'vacaciones'), 'ver', 'ver_vacaciones', 'Ver solicitudes de vacaciones', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'vacaciones'), 'solicitar', 'solicitar_vacaciones', 'Crear una solicitud de vacaciones', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'vacaciones'), 'aprobar', 'aprobar_vacaciones', 'Aprobar o rechazar solicitudes', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )

    # Insertar Permisos de Asistencia
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'asistencia'), 'ver', 'ver_asistencia', 'Ver registros de asistencia', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'asistencia'), 'modificar', 'modificar_asistencia', 'Modificar horas o justificar faltas', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )

    # Insertar Permisos de Configuracion
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'configuracion'), 'ver', 'ver_configuracion', 'Ver panel de configuración', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'configuracion'), 'gestionar', 'gestionar_roles', 'Crear, editar o eliminar Roles', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'configuracion'), 'gestionar', 'gestionar_areas', 'Administrar el catálogo de Áreas', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'configuracion'), 'gestionar', 'gestionar_puestos', 'Administrar el catálogo de Puestos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    op.execute(
        "INSERT INTO permisos (recurso_id, accion, slug, nombre, activo, creado_en, actualizado_en) VALUES ((SELECT id FROM recursos WHERE clave = 'configuracion'), 'asignar', 'asignar_permisos', 'Asignar permisos a roles o usuarios', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )


def downgrade() -> None:
    # Eliminar Permisos insertados
    op.execute(
        "DELETE FROM permisos WHERE slug IN ('ver_empleados', 'crear_empleado', 'editar_empleado', 'eliminar_empleado', 'ver_vacaciones', 'solicitar_vacaciones', 'aprobar_vacaciones', 'ver_asistencia', 'modificar_asistencia', 'ver_configuracion', 'gestionar_roles', 'gestionar_areas', 'gestionar_puestos', 'asignar_permisos')"
    )
    # Eliminar Recursos insertados
    op.execute(
        "DELETE FROM recursos WHERE clave IN ('empleados', 'vacaciones', 'asistencia', 'configuracion')"
    )
