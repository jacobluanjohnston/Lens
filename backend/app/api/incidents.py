"""GET /incidents endpoint.

Returns incident points for the map: {lat, lon, category, occurred_at}.
Requires a date range; caps at 20k results so the browser map stays responsive.
Only incidents with non-null coordinates are returned.
"""

import os
from datetime import date
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter()

_DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")

_LIMIT = 20_000

_QUERY = """
    SELECT lat, lon, category_primary AS category, occurred_at
    FROM incidents
    WHERE city = 'sf'
      AND occurred_at >= %(start)s
      AND occurred_at <  %(end_exclusive)s
      AND lat IS NOT NULL
      AND lon IS NOT NULL
      AND (%(category)s IS NULL OR category_primary = %(category)s)
    ORDER BY occurred_at DESC
    LIMIT %(limit)s
"""


class IncidentPoint(BaseModel):
    lat: float
    lon: float
    category: Optional[str]
    occurred_at: str


@router.get("/incidents", response_model=list[IncidentPoint])
def get_incidents(
    start: date = Query(..., description="Start date (inclusive), YYYY-MM-DD"),
    end: date = Query(..., description="End date (exclusive), YYYY-MM-DD"),
    category: Optional[str] = Query(None, description="Filter to a single normalised category"),
):
    if end <= start:
        raise HTTPException(status_code=422, detail="end must be after start")

    conn = psycopg2.connect(_DB_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                _QUERY,
                {
                    "start":        start,
                    "end_exclusive": end,
                    "category":     category,
                    "limit":        _LIMIT,
                },
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return [
        IncidentPoint(
            lat=r["lat"],
            lon=r["lon"],
            category=r["category"],
            occurred_at=r["occurred_at"].isoformat() if r["occurred_at"] else None,
        )
        for r in rows
    ]
