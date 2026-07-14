"""Tests for the /incidents, /categories, and /neighborhoods endpoints.

Call the route handler functions directly rather than over HTTP so we don't
need an extra dependency (httpx). These work against an empty database — they
check behaviour and schema, not data values.
"""

from datetime import date

import pytest
from fastapi import HTTPException

from app.api.incidents import get_categories, get_incidents
from app.api.lens import get_lens1, get_lens2, get_lens3, _lens2_ratio
from app.api.neighborhoods import get_neighborhoods


def test_reversed_date_range_raises_422():
    with pytest.raises(HTTPException) as exc:
        get_incidents(start=date(2025, 4, 1), end=date(2025, 3, 1), category=None)
    assert exc.value.status_code == 422


def test_valid_date_range_returns_list():
    result = get_incidents(start=date(2025, 1, 1), end=date(2025, 2, 1), category=None)
    assert isinstance(result, list)


def test_incidents_schema():
    result = get_incidents(start=date(2025, 1, 1), end=date(2025, 2, 1), category=None)
    for row in result:
        assert hasattr(row, "lat")
        assert hasattr(row, "lon")
        assert hasattr(row, "category")
        assert hasattr(row, "occurred_at")


def test_category_filter_returns_only_that_category():
    result = get_incidents(
        start=date(2025, 3, 1), end=date(2025, 4, 1), category="Burglary"
    )
    assert isinstance(result, list)
    for row in result:
        assert row.category == "Burglary"


def test_get_categories_returns_list_of_strings():
    result = get_categories()
    assert isinstance(result, list)
    assert all(isinstance(c, str) for c in result)


# ── /neighborhoods ────────────────────────────────────────────────────────────

def test_neighborhoods_returns_feature_collection():
    result = get_neighborhoods()
    assert result["type"] == "FeatureCollection"
    assert isinstance(result["features"], list)


def test_neighborhoods_feature_schema():
    result = get_neighborhoods()
    for feature in result["features"]:
        assert feature["type"] == "Feature"
        assert "geometry" in feature
        props = feature["properties"]
        assert "neighborhood_id" in props
        assert "neighborhood_name" in props
        assert "population" in props
        assert "per_capita_applicable" in props
        assert "low_confidence" in props


# ── /lens/1 ───────────────────────────────────────────────────────────────────

def test_lens1_reversed_date_raises_422():
    with pytest.raises(HTTPException) as exc:
        get_lens1(start=date(2025, 4, 1), end=date(2025, 3, 1), category=None)
    assert exc.value.status_code == 422


def test_lens1_returns_list():
    result = get_lens1(start=date(2025, 1, 1), end=date(2025, 6, 1), category=None)
    assert isinstance(result, list)


def test_lens1_schema():
    result = get_lens1(start=date(2025, 1, 1), end=date(2025, 6, 1), category=None)
    for row in result:
        assert "neighborhood_id" in row
        assert "neighborhood_name" in row
        assert "raw_count" in row
        assert "per_capita" in row
        assert "reference_raw" in row
        assert "reference_per_capita" in row
        assert "low_confidence" in row
        assert "per_capita_applicable" in row


def test_lens1_per_capita_null_for_parks():
    result = get_lens1(start=date(2025, 1, 1), end=date(2025, 6, 1), category=None)
    for row in result:
        if not row["per_capita_applicable"]:
            assert row["per_capita"] is None


# ── /lens/2 ───────────────────────────────────────────────────────────────────

def test_lens2_reversed_date_raises_422():
    with pytest.raises(HTTPException) as exc:
        get_lens2(start=date(2025, 4, 1), end=date(2025, 3, 1))
    assert exc.value.status_code == 422


def test_lens2_returns_list():
    result = get_lens2(start=date(2025, 1, 1), end=date(2025, 6, 1))
    assert isinstance(result, list)


def test_lens2_schema():
    result = get_lens2(start=date(2025, 1, 1), end=date(2025, 6, 1))
    for row in result:
        assert "neighborhood_id" in row
        assert "neighborhood_name" in row
        assert "value" in row
        assert "reference_value" in row
        assert "low_confidence" in row
        assert "per_capita_applicable" in row


def test_lens2_value_null_for_parks():
    result = get_lens2(start=date(2025, 1, 1), end=date(2025, 6, 1))
    for row in result:
        if not row["per_capita_applicable"]:
            assert row["value"] is None


# ── _lens2_ratio (pure unit tests, no DB) ────────────────────────────────────

def test_lens2_ratio_zero_victim_returns_none():
    assert _lens2_ratio(officer_count=50, victim_count=0, per_capita_applicable=True) is None


def test_lens2_ratio_not_applicable_returns_none():
    assert _lens2_ratio(officer_count=50, victim_count=100, per_capita_applicable=False) is None


def test_lens2_ratio_calculation():
    assert _lens2_ratio(officer_count=50, victim_count=100, per_capita_applicable=True) == 50.0


def test_lens2_ratio_above_100():
    # Tenderloin-style over-enforcement: more proactive stops than victim crimes
    assert _lens2_ratio(officer_count=155, victim_count=100, per_capita_applicable=True) == 155.0


def test_lens2_ratio_rounds_to_one_decimal():
    assert _lens2_ratio(officer_count=1, victim_count=3, per_capita_applicable=True) == 33.3


# ── /lens/3 ───────────────────────────────────────────────────────────────────

def test_lens3_returns_503():
    response = get_lens3(start=date(2025, 1, 1), end=date(2025, 6, 1), category="Burglary")
    assert response.status_code == 503


