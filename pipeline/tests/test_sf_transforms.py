"""Unit tests for SF category and resolution normalisation.

These run without a database — they test the transform functions in isolation.
A wrong normalisation never crashes; it silently produces wrong data. These
tests are the primary guard against that.
"""

import math

import pytest

from pipeline.adapters.sf.ingest import (
    _CATEGORY_FIXES,
    _norm_category,
    _norm_resolution,
)
from pipeline.adapters.sf.load_neighborhoods import slugify

# ── Category normalisation ────────────────────────────────────────────────────

def test_every_dirty_category_value_is_fixed():
    """Every entry in the dirty-values map must produce the corrected output."""
    for raw, expected in _CATEGORY_FIXES.items():
        assert _norm_category(raw) == expected, f"{raw!r} did not map to {expected!r}"


def test_nan_category_becomes_unknown():
    assert _norm_category(float("nan")) == "Unknown"
    assert _norm_category(None) == "Unknown"
    assert _norm_category("") == "Unknown"


def test_clean_category_passes_through():
    assert _norm_category("Burglary") == "Burglary"
    assert _norm_category("Assault") == "Assault"
    assert _norm_category("Larceny Theft") == "Larceny Theft"


# ── Resolution normalisation ──────────────────────────────────────────────────

@pytest.mark.parametrize("raw,expected", [
    ("Open or Active",          "open"),
    ("Cite or Arrest Adult",    "arrest_cite"),
    ("Cite or Arrest Juvenile", "arrest_cite"),
    ("Exceptional Adult",       "exceptional"),
    ("Exceptional Juvenile",    "exceptional"),
    ("Unfounded",               "unfounded"),
])
def test_known_resolution_values(raw, expected):
    assert _norm_resolution(raw) == expected


def test_nan_resolution_becomes_open():
    assert _norm_resolution(float("nan")) == "open"
    assert _norm_resolution(None) == "open"
    assert _norm_resolution("") == "open"


def test_unknown_resolution_becomes_other_historical():
    assert _norm_resolution("Some Future Value") == "other_historical"


# ── Neighborhood slug ─────────────────────────────────────────────────────────

def test_slugify():
    assert slugify("Tenderloin") == "tenderloin"
    assert slugify("Financial District/South Beach") == "financial-district-south-beach"
    assert slugify("Oceanview/Merced/Ingleside") == "oceanview-merced-ingleside"
    assert slugify("West of Twin Peaks") == "west-of-twin-peaks"
    assert slugify("Bayview Hunters Point") == "bayview-hunters-point"
