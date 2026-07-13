"""Tests for the /incidents, /categories, and /neighborhoods endpoints.

Call the route handler functions directly rather than over HTTP so we don't
need an extra dependency (httpx). These work against an empty database — they
check behaviour and schema, not data values.
"""

from datetime import date

import pytest
from fastapi import HTTPException

from app.api.incidents import get_categories, get_incidents
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


def test_neighborhoods_returns_41_features():
    result = get_neighborhoods()
    assert len(result["features"]) == 41
