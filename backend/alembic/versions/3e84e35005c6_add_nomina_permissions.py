"""add_nomina_permissions

Revision ID: 3e84e35005c6
Revises: 6f05c40649af
Create Date: 2026-06-14 08:38:55.387173

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "3e84e35005c6"
down_revision: Union[str, Sequence[str], None] = "6f05c40649af"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
