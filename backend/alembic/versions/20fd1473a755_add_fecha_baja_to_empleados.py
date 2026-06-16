"""add fecha_baja to empleados

Revision ID: 20fd1473a755
Revises: 9797697a413c
Create Date: 2026-06-16 02:30:48.281836

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20fd1473a755"
down_revision: Union[str, Sequence[str], None] = "9797697a413c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_baja DATE")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE empleados DROP COLUMN IF EXISTS fecha_baja")
