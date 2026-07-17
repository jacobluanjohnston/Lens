"""GET /lens/1, /lens/2, /lens/3 endpoints.

Lens 1 — raw count + per-capita per neighborhood.
Lens 2 — officer-initiated incidents per 100 victim-reported serious crimes.
Lens 3 — clearance rate gap vs city median. Returns 503 until assault surgery done.

All reference values are citywide medians (not means — robust to outlier neighborhoods).
"""

import os
import statistics
from calendar import monthrange
from datetime import date, datetime
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter()

_DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")

# Bucket B confirmed core (ADR 001, G1 validated 2026-07-08).
# Civil Sidewalks and Stolen Property are sensitivity-only — excluded here.
_OFFICER_CATEGORIES = (
    "Drug Offense", "Drug Violation", "Warrant",
    "Prostitution", "Traffic Violation Arrest", "Weapons Carrying Etc",
)

# Bucket A — victim-reported serious crime.
# Larceny excluded (50.3% Coplogic — see ADR 001).
_VICTIM_CATEGORIES = ("Burglary", "Robbery", "Assault", "Motor Vehicle Theft")


def _connect():
    return psycopg2.connect(_DB_URL)


def _lens2_ratio(officer_count: int, victim_count: int, per_capita_applicable: bool):
    """Enforcement ratio: officer-initiated per 100 victim-reported crimes.

    Returns None for non-residential areas and any neighborhood with zero
    victim-reported crimes in the period (avoids division by zero and
    meaningless infinity values).
    """
    if not per_capita_applicable:
        return None
    if victim_count == 0:
        return None
    return round(officer_count / victim_count * 100, 1)


# ── Lens 1 ────────────────────────────────────────────────────────────────────

_LENS1_QUERY = """
    SELECT
        n.neighborhood_id,
        n.neighborhood_name,
        n.population,
        n.per_capita_applicable,
        n.low_confidence,
        COALESCE(SUM(r.incident_count), 0) AS raw_count
    FROM neighborhoods n
    LEFT JOIN neighborhood_month_rollup r
        ON  r.neighborhood_id = n.neighborhood_id
        AND r.month >= DATE_TRUNC('month', %(start)s::date)::date
        AND r.month <= DATE_TRUNC('month', %(end)s::date)::date
        AND (%(category)s IS NULL OR r.category = %(category)s)
    GROUP BY
        n.neighborhood_id, n.neighborhood_name, n.population,
        n.per_capita_applicable, n.low_confidence
    ORDER BY n.neighborhood_name
"""


@router.get("/lens/1")
def get_lens1(
    start: date = Query(..., description="Start date (inclusive), YYYY-MM-DD"),
    end: date   = Query(..., description="End date (inclusive), YYYY-MM-DD"),
    category: Optional[str] = Query(None, description="Filter to a single category"),
):
    if end < start:
        raise HTTPException(status_code=422, detail="end must be on or after start")

    conn = _connect()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(_LENS1_QUERY, {"start": start, "end": end, "category": category})
            rows = cur.fetchall()
    finally:
        conn.close()

    # Compute per-capita and reference medians server-side
    raw_counts = [r["raw_count"] for r in rows]
    reference_raw = statistics.median(raw_counts) if raw_counts else 0

    per_capitas = [
        r["raw_count"] / r["population"] * 1000
        for r in rows
        if r["per_capita_applicable"] and r["population"]
    ]
    reference_per_capita = statistics.median(per_capitas) if per_capitas else None

    return [
        {
            "neighborhood_id":       r["neighborhood_id"],
            "neighborhood_name":     r["neighborhood_name"],
            "raw_count":             r["raw_count"],
            "per_capita":            (
                round(r["raw_count"] / r["population"] * 1000, 1)
                if r["per_capita_applicable"] and r["population"]
                else None
            ),
            "reference_raw":         reference_raw,
            "reference_per_capita":  reference_per_capita,
            "low_confidence":        r["low_confidence"],
            "per_capita_applicable": r["per_capita_applicable"],
        }
        for r in rows
    ]


# ── Lens 2 ────────────────────────────────────────────────────────────────────

_LENS2_QUERY = """
    SELECT
        n.neighborhood_id,
        n.neighborhood_name,
        n.per_capita_applicable,
        n.low_confidence,
        COALESCE(SUM(
            CASE WHEN r.category = ANY(%(officer_cats)s) THEN r.incident_count ELSE 0 END
        ), 0) AS officer_count,
        COALESCE(SUM(
            CASE WHEN r.category = ANY(%(victim_cats)s)  THEN r.incident_count ELSE 0 END
        ), 0) AS victim_count
    FROM neighborhoods n
    LEFT JOIN neighborhood_month_rollup r
        ON  r.neighborhood_id = n.neighborhood_id
        AND r.month >= DATE_TRUNC('month', %(start)s::date)::date
        AND r.month <= DATE_TRUNC('month', %(end)s::date)::date
    GROUP BY
        n.neighborhood_id, n.neighborhood_name,
        n.per_capita_applicable, n.low_confidence
    ORDER BY n.neighborhood_name
"""


@router.get("/lens/2")
def get_lens2(
    start: date = Query(..., description="Start date (inclusive), YYYY-MM-DD"),
    end: date   = Query(..., description="End date (inclusive), YYYY-MM-DD"),
):
    if end < start:
        raise HTTPException(status_code=422, detail="end must be on or after start")

    conn = _connect()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(_LENS2_QUERY, {
                "start":        start,
                "end":          end,
                "officer_cats": list(_OFFICER_CATEGORIES),
                "victim_cats":  list(_VICTIM_CATEGORIES),
            })
            rows = cur.fetchall()
    finally:
        conn.close()

    values = [_lens2_ratio(r["officer_count"], r["victim_count"], r["per_capita_applicable"]) for r in rows]
    valid_values = [v for v in values if v is not None]
    reference_value = round(statistics.median(valid_values), 1) if valid_values else None

    return [
        {
            "neighborhood_id":       r["neighborhood_id"],
            "neighborhood_name":     r["neighborhood_name"],
            "value":                 values[i],
            "reference_value":       reference_value,
            "low_confidence":        r["low_confidence"],
            "per_capita_applicable": r["per_capita_applicable"],
        }
        for i, r in enumerate(rows)
    ]


# ── Lens 3 ────────────────────────────────────────────────────────────────────

@router.get("/lens/3")
def get_lens3(
    start:    date = Query(...),
    end:      date = Query(...),
    category: str  = Query(..., description="Burglary, Robbery, Assault, or Motor Vehicle Theft"),
):
    return JSONResponse(
        status_code=503,
        content={"detail": "Lens 3 not yet available — assault surgery pending"},
    )


# ── Compare ───────────────────────────────────────────────────────────────────
# Card 1, Sprint 4. Per-neighborhood change in the Lens 2 enforcement ratio
# between a baseline window and a compare window (e.g. before/after a policy
# event). Dates are YYYY-MM (month granularity) — the underlying dataset has
# no day-level precision, so YYYY-MM-DD would be false precision.

def _parse_year_month(value: str, field_name: str) -> date:
    """Parse a 'YYYY-MM' string into the first day of that month."""
    try:
        return datetime.strptime(value, "%Y-%m").date()
    except ValueError:
        raise HTTPException(status_code=422, detail=f"{field_name} must be in YYYY-MM format")


def _month_end(d: date) -> date:
    """Last calendar day of the month containing d."""
    return date(d.year, d.month, monthrange(d.year, d.month)[1])


_COMPARE_QUERY = """
    SELECT
        n.neighborhood_id,
        n.neighborhood_name,
        n.per_capita_applicable,
        n.low_confidence,
        COALESCE(SUM(
            CASE WHEN r.month BETWEEN %(baseline_start)s AND %(baseline_end)s
                  AND r.category = ANY(%(officer_cats)s)
                 THEN r.incident_count ELSE 0 END
        ), 0) AS baseline_officer_count,
        COALESCE(SUM(
            CASE WHEN r.month BETWEEN %(baseline_start)s AND %(baseline_end)s
                  AND r.category = ANY(%(victim_cats)s)
                 THEN r.incident_count ELSE 0 END
        ), 0) AS baseline_victim_count,
        COALESCE(SUM(
            CASE WHEN r.month BETWEEN %(compare_start)s AND %(compare_end)s
                  AND r.category = ANY(%(officer_cats)s)
                 THEN r.incident_count ELSE 0 END
        ), 0) AS compare_officer_count,
        COALESCE(SUM(
            CASE WHEN r.month BETWEEN %(compare_start)s AND %(compare_end)s
                  AND r.category = ANY(%(victim_cats)s)
                 THEN r.incident_count ELSE 0 END
        ), 0) AS compare_victim_count
    FROM neighborhoods n
    LEFT JOIN neighborhood_month_rollup r
        ON  r.neighborhood_id = n.neighborhood_id
        AND (
            r.month BETWEEN %(baseline_start)s AND %(baseline_end)s
            OR r.month BETWEEN %(compare_start)s AND %(compare_end)s
        )
    GROUP BY
        n.neighborhood_id, n.neighborhood_name,
        n.per_capita_applicable, n.low_confidence
    ORDER BY n.neighborhood_name
"""


@router.get("/lens/compare")
def get_lens_compare(
    baseline_start: Optional[str] = Query(None, description="Baseline window start, YYYY-MM"),
    baseline_end:   Optional[str] = Query(None, description="Baseline window end, YYYY-MM"),
    compare_start:  Optional[str] = Query(None, description="Compare window start, YYYY-MM"),
    compare_end:    Optional[str] = Query(None, description="Compare window end, YYYY-MM"),
):
    raw_params = {
        "baseline_start": baseline_start,
        "baseline_end":   baseline_end,
        "compare_start":  compare_start,
        "compare_end":    compare_end,
    }
    missing = [name for name, value in raw_params.items() if not value]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required date param(s): {', '.join(missing)}",
        )

    b_start = _parse_year_month(baseline_start, "baseline_start")
    b_end   = _parse_year_month(baseline_end, "baseline_end")
    c_start = _parse_year_month(compare_start, "compare_start")
    c_end   = _parse_year_month(compare_end, "compare_end")

    if b_end <= b_start:
        raise HTTPException(status_code=422, detail="baseline_end must be after baseline_start")
    if c_end <= c_start:
        raise HTTPException(status_code=422, detail="compare_end must be after compare_start")

    if (_month_end(b_end) - b_start).days < 30:
        raise HTTPException(status_code=422, detail="baseline window must span at least 30 days")
    if (_month_end(c_end) - c_start).days < 30:
        raise HTTPException(status_code=422, detail="compare window must span at least 30 days")

    conn = _connect()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(_COMPARE_QUERY, {
                "baseline_start": b_start,
                "baseline_end":   b_end,
                "compare_start":  c_start,
                "compare_end":    c_end,
                "officer_cats":   list(_OFFICER_CATEGORIES),
                "victim_cats":    list(_VICTIM_CATEGORIES),
            })
            rows = cur.fetchall()
    finally:
        conn.close()

    results = []
    for r in rows:
        baseline_ratio = _lens2_ratio(
            r["baseline_officer_count"], r["baseline_victim_count"], r["per_capita_applicable"]
        )
        compare_ratio = _lens2_ratio(
            r["compare_officer_count"], r["compare_victim_count"], r["per_capita_applicable"]
        )
        delta = (
            round(compare_ratio - baseline_ratio, 1)
            if baseline_ratio is not None and compare_ratio is not None
            else None
        )
        results.append({
            "neighborhood_id":   r["neighborhood_id"],
            "neighborhood_name": r["neighborhood_name"],
            "baseline_ratio":    baseline_ratio,
            "compare_ratio":     compare_ratio,
            "delta":             delta,
            "baseline_count":    r["baseline_officer_count"],
            "compare_count":     r["compare_officer_count"],
        })

    return results
