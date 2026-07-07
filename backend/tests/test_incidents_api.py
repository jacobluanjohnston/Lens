"""Tests for the /incidents and /categories endpoints.

Call the route handler functions directly rather than over HTTP so we don't
need an extra dependency (httpx). These work against an empty database — they
check behaviour and schema, not data values.
"""

from datetime import date

import pytest
from fastapi import HTTPException

from app.api.incidents import get_categories, get_incidents


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
