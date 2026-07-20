"""Regression tests for the category buckets and Lens 1 arithmetic."""

from datetime import date

import pytest

from app.api.lens import (
    _OFFICER_CATEGORIES,
    _VICTIM_CATEGORIES,
    get_lens1,
)

from .conftest import RATIO_NBHD, RATIO_ROWS


@pytest.mark.parametrize(
    "category",
    ["Drug Offense", "Warrant", "Prostitution", "Drug Violation"],
)
def test_officer_initiated_category_bucket(category):
    assert category in _OFFICER_CATEGORIES


@pytest.mark.parametrize(
    "category",
    ["Burglary", "Robbery", "Assault", "Motor Vehicle Theft"],
)
def test_victim_reported_category_bucket(category):
    assert category in _VICTIM_CATEGORIES


def test_lens1_per_capita_matches_seeded_incident_count_and_population():
    result = get_lens1(
        start=date(2099, 1, 1),
        end=date(2099, 6, 30),
        category=None,
    )
    row = next(item for item in result if item["neighborhood_id"] == RATIO_NBHD)

    incident_count = sum(count for _, _, count in RATIO_ROWS)
    population = 10_000
    expected_per_capita = round(incident_count / population * 1000, 1)

    assert row["raw_count"] == incident_count
    assert row["per_capita"] == expected_per_capita
