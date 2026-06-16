"""fix_empleados_permissions_slug

Revision ID: 9797697a413c
Revises: 81e97e551021
Create Date: 2026-06-14 10:58:47.000998

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9797697a413c"
down_revision: Union[str, Sequence[str], None] = "81e97e551021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("DELETE FROM permisos WHERE slug = 'crear_empleado'")
    op.execute("DELETE FROM permisos WHERE slug = 'editar_empleado'")
    op.execute("DELETE FROM permisos WHERE slug = 'eliminar_empleado'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
