"""Tests for the /lens/compare endpoint.

Uses real seeded rows in neighborhood_month_rollup — no mocking psycopg2 and
no patched DB connection, per Card 1's DoD. Seeded rows live in a synthetic
month range (year 2099) far outside any real ingested data, so they can
never collide with real rows, and are deleted again after each test.

No expected delta value is hardcoded: tests compute the expected ratio/delta
from the same seeded counts they insert, using the same _lens2_ratio formula
the endpoint itself uses.
"""

from datetime import date

import pytest
from fastapi import HTTPException

from app.api.lens import _connect, _lens2_ratio, get_lens_compare

# Synthetic months used for seeded test data.
_BASELINE_MONTHS = [date(2099, 1, 1), date(2099, 2, 1), date(2099, 3, 1)]
_COMPARE_MONTHS = [date(2099, 4, 1), date(2099, 5, 1), date(2099, 6, 1)]
_ALL_MONTHS = _BASELINE_MONTHS + _COMPARE_MONTHS


def _pick_test_neighborhood() -> str:
    """Grab a real, per-capita-applicable neighborhood_id to seed rows against."""
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT neighborhood_id FROM neighborhoods "
                "WHERE per_capita_applicable = true ORDER BY neighborhood_id LIMIT 1"
            )
            row = cur.fetchone()
    finally:
        conn.close()
    assert row is not None, "no per-capita-applicable neighborhood found — is the DB seeded?"
    return row[0]


def _seed_rollup_rows(neighborhood_id, rows):
    """rows: list of (month, category, incident_count) tuples."""
    conn = _connect()
    try:
        with conn.cursor() as cur:
            for month, category, count in rows:
                cur.execute(
                    """
                    INSERT INTO neighborhood_month_rollup
                        (neighborhood_id, month, category, incident_count)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (neighborhood_id, month, category)
                    DO UPDATE SET incident_count = EXCLUDED.incident_count
                    """,
                    (neighborhood_id, month, category, count),
                )
        conn.commit()
    finally:
        conn.close()


def _cleanup_rollup_rows(neighborhood_id, months):
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM neighborhood_month_rollup "
                "WHERE neighborhood_id = %s AND month = ANY(%s)",
                (neighborhood_id, months),
            )
        conn.commit()
    finally:
        conn.close()


@pytest.fixture
def seeded_neighborhood():
    """Seed known officer/victim counts across the synthetic baseline and
    compare windows for one real neighborhood, and clean up afterward."""
    neighborhood_id = _pick_test_neighborhood()
    rows = [
        (_BASELINE_MONTHS[0], "Warrant", 10),
        (_BASELINE_MONTHS[1], "Warrant", 5),
        (_BASELINE_MONTHS[0], "Burglary", 20),
        (_COMPARE_MONTHS[0], "Warrant", 40),
        (_COMPARE_MONTHS[1], "Warrant", 20),
        (_COMPARE_MONTHS[0], "Burglary", 10),
    ]
    _seed_rollup_rows(neighborhood_id, rows)
    yield neighborhood_id, rows
    _cleanup_rollup_rows(neighborhood_id, _ALL_MONTHS)


@pytest.fixture
def zero_victim_neighborhood():
    """Seed a neighborhood with officer activity but zero victim-reported
    crime in both windows, and clean up afterward."""
    neighborhood_id = _pick_test_neighborhood()
    rows = [
        (_BASELINE_MONTHS[0], "Warrant", 15),
        (_COMPARE_MONTHS[0], "Warrant", 25),
    ]
    _seed_rollup_rows(neighborhood_id, rows)
    yield neighborhood_id
    _cleanup_rollup_rows(neighborhood_id, _ALL_MONTHS)


# ── /lens/compare ─────────────────────────────────────────────────────────────

def test_compare_valid_request_returns_41_rows():
    result = get_lens_compare(
        baseline_start="2024-04", baseline_end="2024-12",
        compare_start="2025-01", compare_end="2025-09",
    )
    assert len(result) == 41


def test_compare_missing_param_returns_422():
    with pytest.raises(HTTPException) as exc:
        get_lens_compare(
            baseline_start=None, baseline_end="2024-12",
            compare_start="2025-01", compare_end="2025-09",
        )
    assert exc.value.status_code == 422


def test_compare_window_too_short_returns_422():
    with pytest.raises(HTTPException) as exc:
        get_lens_compare(
            baseline_start="2024-04", baseline_end="2024-04",
            compare_start="2025-01", compare_end="2025-09",
        )
    assert exc.value.status_code == 422


def test_compare_zero_victim_returns_null_delta_without_crashing(zero_victim_neighborhood):
    neighborhood_id = zero_victim_neighborhood
    result = get_lens_compare(
        baseline_start="2099-01", baseline_end="2099-03",
        compare_start="2099-04", compare_end="2099-06",
    )
    row = next(r for r in result if r["neighborhood_id"] == neighborhood_id)
    assert row["delta"] is None


def test_compare_delta_matches_computed_value(seeded_neighborhood):
    neighborhood_id, rows = seeded_neighborhood

    # Expected values are computed from the seeded rows themselves — never
    # hardcoded — using the same formula the endpoint uses.
    baseline_officer = sum(c for m, cat, c in rows if m in _BASELINE_MONTHS and cat == "Warrant")
    baseline_victim = sum(c for m, cat, c in rows if m in _BASELINE_MONTHS and cat == "Burglary")
    compare_officer = sum(c for m, cat, c in rows if m in _COMPARE_MONTHS and cat == "Warrant")
    compare_victim = sum(c for m, cat, c in rows if m in _COMPARE_MONTHS and cat == "Burglary")

    expected_baseline_ratio = _lens2_ratio(baseline_officer, baseline_victim, True)
    expected_compare_ratio = _lens2_ratio(compare_officer, compare_victim, True)
    expected_delta = round(expected_compare_ratio - expected_baseline_ratio, 1)

    result = get_lens_compare(
        baseline_start="2099-01", baseline_end="2099-03",
        compare_start="2099-04", compare_end="2099-06",
    )
    row = next(r for r in result if r["neighborhood_id"] == neighborhood_id)

    assert row["baseline_ratio"] == expected_baseline_ratio
    assert row["compare_ratio"] == expected_compare_ratio
    assert row["delta"] == expected_delta
    assert row["baseline_count"] == baseline_officer
    assert row["compare_count"] == compare_officer