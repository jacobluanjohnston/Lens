"""Test database setup for the backend suite.

Creates a dedicated `lens_test` database, runs migrations into it, and seeds
41 synthetic neighborhoods — matching SF's real neighborhood count so the
compare endpoint's "41 rows" contract can be asserted without depending on
the full SF dataset being loaded.

The real `lens` database is never read or written by tests, so a developer's
locally ingested data survives a test run untouched, and CI needs no seed
step of its own.

Two of the 41 are special:
  - RATIO_NBHD        — known officer/victim counts in both windows
  - ZERO_VICTIM_NBHD  — officer activity but zero victim-reported crime

Seeded months live in year 2099, far outside any real ingested data.
"""

import os
from datetime import date
from pathlib import Path

import psycopg2
import pytest
from alembic import command
from alembic.config import Config
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

_BASE_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")
_TEST_DB_NAME = "lens_test"
_TEST_URL = _BASE_URL.rsplit("/", 1)[0] + "/" + _TEST_DB_NAME
_ADMIN_URL = _BASE_URL.rsplit("/", 1)[0] + "/postgres"

_ALEMBIC_INI = Path(__file__).resolve().parent.parent / "alembic.ini"

# ── Seeded data ───────────────────────────────────────────────────────────────

NEIGHBORHOOD_COUNT = 41

RATIO_NBHD = "test-nbhd-01"
ZERO_VICTIM_NBHD = "test-nbhd-02"

BASELINE_MONTHS = [date(2099, 1, 1), date(2099, 2, 1), date(2099, 3, 1)]
COMPARE_MONTHS = [date(2099, 4, 1), date(2099, 5, 1), date(2099, 6, 1)]

# (month, category, incident_count) — the delta test computes its expected
# values from these rather than hardcoding a number.
RATIO_ROWS = [
    (BASELINE_MONTHS[0], "Warrant", 10),
    (BASELINE_MONTHS[1], "Warrant", 5),
    (BASELINE_MONTHS[0], "Burglary", 20),
    (COMPARE_MONTHS[0], "Warrant", 40),
    (COMPARE_MONTHS[1], "Warrant", 20),
    (COMPARE_MONTHS[0], "Burglary", 10),
]

ZERO_VICTIM_ROWS = [
    (BASELINE_MONTHS[0], "Warrant", 15),
    (COMPARE_MONTHS[0], "Warrant", 25),
]


def _recreate_test_database():
    conn = psycopg2.connect(_ADMIN_URL)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    try:
        with conn.cursor() as cur:
            cur.execute(f'DROP DATABASE IF EXISTS "{_TEST_DB_NAME}"')
            cur.execute(f'CREATE DATABASE "{_TEST_DB_NAME}"')
    finally:
        conn.close()


def _drop_test_database():
    conn = psycopg2.connect(_ADMIN_URL)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = %s AND pid <> pg_backend_pid()",
                (_TEST_DB_NAME,),
            )
            cur.execute(f'DROP DATABASE IF EXISTS "{_TEST_DB_NAME}"')
    finally:
        conn.close()


def _run_migrations():
    """Apply the real migrations, so tests run against the real schema."""
    previous = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = _TEST_URL
    try:
        cfg = Config(str(_ALEMBIC_INI))
        command.upgrade(cfg, "head")
    finally:
        if previous is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous


def _seed():
    conn = psycopg2.connect(_TEST_URL)
    try:
        with conn.cursor() as cur:
            for i in range(1, NEIGHBORHOOD_COUNT + 1):
                cur.execute(
                    """
                    INSERT INTO neighborhoods
                        (neighborhood_id, neighborhood_name, population,
                         per_capita_applicable, low_confidence)
                    VALUES (%s, %s, 10000, true, false)
                    """,
                    (f"test-nbhd-{i:02d}", f"Test Neighborhood {i:02d}"),
                )

            for nbhd, rows in ((RATIO_NBHD, RATIO_ROWS), (ZERO_VICTIM_NBHD, ZERO_VICTIM_ROWS)):
                for month, category, count in rows:
                    cur.execute(
                        """
                        INSERT INTO neighborhood_month_rollup
                            (neighborhood_id, month, category, incident_count)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (nbhd, month, category, count),
                    )
        conn.commit()
    finally:
        conn.close()


@pytest.fixture(scope="session", autouse=True)
def test_database():
    """Build an isolated, seeded database and point the API at it."""
    _recreate_test_database()
    _run_migrations()
    _seed()

    # _connect() reads this module global at call time, so repointing it here
    # redirects every query the API makes for the duration of the session.
    from app.api import lens

    original = lens._DB_URL
    lens._DB_URL = _TEST_URL
    try:
        yield
    finally:
        lens._DB_URL = original
        _drop_test_database()