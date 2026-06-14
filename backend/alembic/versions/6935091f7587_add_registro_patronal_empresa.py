"""add_registro_patronal_empresa

Revision ID: 6935091f7587
Revises: 3e84e35005c6
Create Date: 2026-06-14 08:51:48.841304

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6935091f7587"
down_revision: Union[str, Sequence[str], None] = "3e84e35005c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "info_empresa", sa.Column("registro_patronal", sa.String(length=20), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("info_empresa", "registro_patronal")
