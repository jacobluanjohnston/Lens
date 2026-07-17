"""Tests for the /lens/compare endpoint.

Runs against the seeded `lens_test` database built by conftest.py — a real
database with real migrations and real rows, no mocked connection and no
patched psycopg2, per Card 1's DoD.

No expected delta is hardcoded: the delta test computes its expectation from
the same seeded counts conftest inserted, using the same _lens2_ratio formula
the endpoint uses.
"""

import pytest
from fastapi import HTTPException

from app.api.lens import _lens2_ratio, get_lens_compare

from .conftest import (
    BASELINE_MONTHS,
    COMPARE_MONTHS,
    NEIGHBORHOOD_COUNT,
    RATIO_NBHD,
    RATIO_ROWS,
    ZERO_VICTIM_NBHD,
)


def test_compare_valid_request_returns_41_rows():
    """41 rows come back against a window that has real seeded data."""
    result = get_lens_compare(
        baseline_start="2099-01", baseline_end="2099-03",
        compare_start="2099-04", compare_end="2099-06",
    )
    assert len(result) == NEIGHBORHOOD_COUNT
    assert any(r["baseline_ratio"] is not None for r in result)


def test_compare_returns_every_neighborhood_even_with_no_rollup_rows():
    """The LEFT JOIN must not drop neighborhoods that have no data in either
    window — they should come back with null ratios, not go missing."""
    result = get_lens_compare(
        baseline_start="2024-04", baseline_end="2024-12",
        compare_start="2025-01", compare_end="2025-09",
    )
    assert len(result) == NEIGHBORHOOD_COUNT
    assert all(r["baseline_ratio"] is None for r in result)


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


def test_compare_zero_victim_returns_null_delta_without_crashing():
    result = get_lens_compare(
        baseline_start="2099-01", baseline_end="2099-03",
        compare_start="2099-04", compare_end="2099-06",
    )
    row = next(r for r in result if r["neighborhood_id"] == ZERO_VICTIM_NBHD)
    assert row["delta"] is None


def test_compare_delta_matches_computed_value():
    # Expected values come from the seeded rows themselves — never hardcoded.
    baseline_officer = sum(c for m, cat, c in RATIO_ROWS if m in BASELINE_MONTHS and cat == "Warrant")
    baseline_victim = sum(c for m, cat, c in RATIO_ROWS if m in BASELINE_MONTHS and cat == "Burglary")
    compare_officer = sum(c for m, cat, c in RATIO_ROWS if m in COMPARE_MONTHS and cat == "Warrant")
    compare_victim = sum(c for m, cat, c in RATIO_ROWS if m in COMPARE_MONTHS and cat == "Burglary")

    expected_baseline_ratio = _lens2_ratio(baseline_officer, baseline_victim, True)
    expected_compare_ratio = _lens2_ratio(compare_officer, compare_victim, True)
    expected_delta = round(expected_compare_ratio - expected_baseline_ratio, 1)

    result = get_lens_compare(
        baseline_start="2099-01", baseline_end="2099-03",
        compare_start="2099-04", compare_end="2099-06",
    )
    row = next(r for r in result if r["neighborhood_id"] == RATIO_NBHD)

    assert row["baseline_ratio"] == expected_baseline_ratio
    assert row["compare_ratio"] == expected_compare_ratio
    assert row["delta"] == expected_delta
    assert row["baseline_count"] == baseline_officer
    assert row["compare_count"] == compare_officer