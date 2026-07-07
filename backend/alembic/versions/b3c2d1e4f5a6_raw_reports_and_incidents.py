"""raw_reports and incidents tables

Revision ID: b3c2d1e4f5a6
Revises: aa5f998dcc5a
Create Date: 2026-07-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'b3c2d1e4f5a6'
down_revision: Union[str, Sequence[str], None] = 'aa5f998dcc5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TYPE resolution_status AS ENUM (
            'open',
            'arrest_cite',
            'exceptional',
            'unfounded',
            'other_historical'
        )
    """)

    op.execute("""
        CREATE TABLE raw_reports (
            row_id          text        PRIMARY KEY,
            incident_number text,
            incident_id     text,
            report_type     text,
            incident_code   text,
            category_raw    text,
            category        text,
            subcategory     text,
            description     text,
            resolution_raw  text,
            resolution      resolution_status,
            occurred_at     timestamp,
            reported_at     timestamp,
            lat             double precision,
            lon             double precision,
            neighborhood    text,
            district        text,
            cad_number      text,
            city            text        NOT NULL,
            dataset         text        NOT NULL,
            snapshot_date   date
        )
    """)

    op.execute("""
        CREATE TABLE incidents (
            incident_number        text    PRIMARY KEY,
            city                   text    NOT NULL,
            occurred_at            timestamp,
            category_primary       text,
            n_codes                integer,
            n_reports              integer,
            resolution_initial     resolution_status,
            resolution_latest      resolution_status,
            resolution_changed     boolean,
            has_supplement         boolean,
            lat                    double precision,
            lon                    double precision,
            neighborhood           text,
            district               text,
            orphan_supplement_only boolean
        )
    """)

    # Indexes for the GET /incidents API query pattern:
    # occurred_at range filter + optional category_primary equality
    op.execute("""
        CREATE INDEX idx_incidents_occurred_at
            ON incidents (occurred_at)
    """)
    op.execute("""
        CREATE INDEX idx_incidents_city_occurred_at
            ON incidents (city, occurred_at)
            WHERE lat IS NOT NULL AND lon IS NOT NULL
    """)
    op.execute("""
        CREATE INDEX idx_incidents_category
            ON incidents (category_primary)
    """)

    # raw_reports index for join and supplement-linkage queries
    op.execute("""
        CREATE INDEX idx_raw_reports_incident_number
            ON raw_reports (incident_number)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS incidents")
    op.execute("DROP TABLE IF EXISTS raw_reports")
    op.execute("DROP TYPE IF EXISTS resolution_status")
