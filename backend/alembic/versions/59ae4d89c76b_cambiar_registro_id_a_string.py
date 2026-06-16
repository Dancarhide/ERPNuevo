"""Cambiar_registro_id_a_String

Revision ID: 59ae4d89c76b
Revises: d4e2020b04be
Create Date: 2026-06-16 14:30:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "59ae4d89c76b"
down_revision = "d4e2020b04be"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "auditoria_logs",
        "registro_id",
        existing_type=sa.INTEGER(),
        type_=sa.String(length=100),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "auditoria_logs",
        "registro_id",
        existing_type=sa.String(length=100),
        type_=sa.INTEGER(),
        existing_nullable=False,
    )
