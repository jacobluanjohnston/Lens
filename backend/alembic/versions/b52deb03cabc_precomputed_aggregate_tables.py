"""precomputed aggregate tables

Revision ID: b52deb03cabc
Revises: 40c7e2a3a883
Create Date: 2026-07-13 06:05:51.089210

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b52deb03cabc'
down_revision: Union[str, Sequence[str], None] = '40c7e2a3a883'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE neighborhood_month_rollup (
            neighborhood_id   text    NOT NULL REFERENCES neighborhoods(neighborhood_id),
            month             date    NOT NULL,
            category          text    NOT NULL,
            incident_count    integer NOT NULL DEFAULT 0,
            resolved_count    integer NOT NULL DEFAULT 0,
            arrest_count      integer NOT NULL DEFAULT 0,
            population        integer,
            PRIMARY KEY (neighborhood_id, month, category)
        )
    """)

    op.execute("""
        CREATE INDEX idx_rollup_neighborhood_month
            ON neighborhood_month_rollup (neighborhood_id, month)
    """)

    op.execute("""
        CREATE INDEX idx_rollup_category_month
            ON neighborhood_month_rollup (category, month)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS neighborhood_month_rollup")
