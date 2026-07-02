"""baseline

Revision ID: aa5f998dcc5a
Revises: 
Create Date: 2026-07-02 07:44:42.797972

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'aa5f998dcc5a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
