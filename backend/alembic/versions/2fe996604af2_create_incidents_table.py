"""create incidents table

Revision ID: 2fe996604af2
Revises: aa5f998dcc5a
Create Date: 2026-07-02 07:44:42.797972

"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from alembic import op

revision: str = '2fe996604af2'
down_revision: Union[str, Sequence[str], None] = 'aa5f998dcc5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'incidents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('incident_date', sa.DateTime(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('neighborhood', sa.String(), nullable=True),
        sa.Column('is_officer_initiated', sa.Boolean(), nullable=True),
        sa.Column('was_resolved', sa.Boolean(), nullable=True),
        sa.Column('raw_data', sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('incidents')