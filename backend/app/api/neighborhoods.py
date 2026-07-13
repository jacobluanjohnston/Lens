"""GET /neighborhoods endpoint.

Returns all 41 SF Analysis Neighborhoods as a GeoJSON FeatureCollection.
Each feature carries properties the frontend needs to colour the choropleth
and handle per-capita suppression for parks/military neighborhoods.
"""

import json
import os

import psycopg2
import psycopg2.extras
from fastapi import APIRouter

router = APIRouter()

_DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")

_QUERY = """
    SELECT
        neighborhood_id,
        neighborhood_name,
        population,
        per_capita_applicable,
        low_confidence,
        ST_AsGeoJSON(geom) AS geometry
    FROM neighborhoods
    ORDER BY neighborhood_name
"""


@router.get("/neighborhoods")
def get_neighborhoods():
    """GeoJSON FeatureCollection of all 41 SF Analysis Neighborhoods."""
    conn = psycopg2.connect(_DB_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(_QUERY)
            rows = cur.fetchall()
    finally:
        conn.close()

    features = [
        {
            "type": "Feature",
            "geometry": json.loads(row["geometry"]),
            "properties": {
                "neighborhood_id":      row["neighborhood_id"],
                "neighborhood_name":    row["neighborhood_name"],
                "population":           row["population"],
                "per_capita_applicable": row["per_capita_applicable"],
                "low_confidence":       row["low_confidence"],
            },
        }
        for row in rows
    ]

    return {"type": "FeatureCollection", "features": features}
