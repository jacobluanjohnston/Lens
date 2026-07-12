"""geography dimension table

Revision ID: 40c7e2a3a883
Revises: b3c2d1e4f5a6
Create Date: 2026-07-11 22:39:22.898800

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '40c7e2a3a883'
down_revision: Union[str, Sequence[str], None] = 'b3c2d1e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostGIS extension (may already exist — IF NOT EXISTS is safe)
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.execute("""
        CREATE TABLE neighborhoods (
            neighborhood_id   text    PRIMARY KEY,
            neighborhood_name text    NOT NULL UNIQUE,
            population        integer,
            per_capita_applicable boolean NOT NULL DEFAULT true,
            low_confidence    boolean NOT NULL DEFAULT false,
            geom              geometry(MultiPolygon, 4326)
        )
    """)

    op.execute("""
        CREATE INDEX idx_neighborhoods_geom
            ON neighborhoods USING GIST (geom)
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS neighborhoods")