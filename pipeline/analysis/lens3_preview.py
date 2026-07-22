"""Lens 3 preview — long-run unsolved rate by neighborhood and crime type.

Answers the question G2 didn't ask: of all bucket A cases old enough that
the resolution window has definitively closed, what share are still open?
And does that rate vary by neighborhood?

That neighborhood variation IS Lens 3.

Only looks at cases where occurred_at < 2024-01-01 so every case has had
at least 180+ days (the longest G2 window) to receive a supplement.

Run from repo root:
  docker compose run --rm -v "$(pwd):/app" -e DATABASE_URL=postgresql://lens:lens@db:5432/lens backend python3 pipeline/analysis/lens3_preview.py
"""

import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")
WIDTH = 100
CUTOFF = "2024-01-01"

BUCKET_A = ("Burglary", "Robbery", "Motor Vehicle Theft", "Assault")

conn = psycopg2.connect(DB_URL)

# ── 1. Citywide unsolved rate by crime type ───────────────────────────────────
print(f'\n{"=" * WIDTH}')
print(f"Citywide long-run unsolved rate by crime type (occurred before {CUTOFF})")
print(f'{"=" * WIDTH}')
print(f'  {"category":<30} {"total":>8} {"still open":>12} {"% unsolved":>12} {"% resolved":>12}')
print(f'  {"-"*30} {"-"*8} {"-"*12} {"-"*12} {"-"*12}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT
            category_primary,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE resolution_latest = 'open') AS still_open,
            ROUND(COUNT(*) FILTER (WHERE resolution_latest = 'open') * 100.0 / COUNT(*), 1) AS pct_unsolved,
            ROUND(COUNT(*) FILTER (WHERE resolution_latest = 'arrest_cite') * 100.0 / COUNT(*), 1) AS pct_resolved
        FROM incidents
        WHERE city = 'sf'
          AND category_primary = ANY(%s)
          AND occurred_at < %s
        GROUP BY category_primary
        ORDER BY pct_unsolved DESC
    """, (list(BUCKET_A), CUTOFF))
    citywide = {row[0]: row for row in cur.fetchall()}
    for row in citywide.values():
        cat, total, still_open, pct_unsolved, pct_resolved = row
        print(f"  {str(cat):<30} {total:>8,} {still_open:>12,} {str(pct_unsolved):>11}% {str(pct_resolved):>11}%")

# ── 2. Per-neighborhood unsolved rate — all bucket A combined ─────────────────
print(f'\n{"=" * WIDTH}')
print(f"Per-neighborhood unsolved rate — all bucket A combined (occurred before {CUTOFF})")
print("Sorted by % unsolved descending — high = under-served")
print(f'{"=" * WIDTH}')
print(f'  {"neighborhood":<35} {"total":>8} {"still open":>12} {"% unsolved":>12} {"vs citywide":>12}')
print(f'  {"-"*35} {"-"*8} {"-"*12} {"-"*12} {"-"*12}')

with conn.cursor() as cur:
    cur.execute("""
        WITH citywide AS (
            SELECT
                ROUND(COUNT(*) FILTER (WHERE resolution_latest = 'open') * 100.0 / COUNT(*), 1)
                    AS pct_unsolved
            FROM incidents
            WHERE city = 'sf'
              AND category_primary = ANY(%s)
              AND occurred_at < %s
        )
        SELECT
            i.neighborhood,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE i.resolution_latest = 'open') AS still_open,
            ROUND(COUNT(*) FILTER (WHERE i.resolution_latest = 'open') * 100.0 / COUNT(*), 1) AS pct_unsolved,
            ROUND(COUNT(*) FILTER (WHERE i.resolution_latest = 'open') * 100.0 / COUNT(*), 1)
                - c.pct_unsolved AS vs_citywide
        FROM incidents i, citywide c
        WHERE i.city = 'sf'
          AND i.category_primary = ANY(%s)
          AND i.occurred_at < %s
          AND i.neighborhood IS NOT NULL
        GROUP BY i.neighborhood, c.pct_unsolved
        HAVING COUNT(*) >= 50
        ORDER BY pct_unsolved DESC
    """, (list(BUCKET_A), CUTOFF, list(BUCKET_A), CUTOFF))
    for row in cur.fetchall():
        hood, total, still_open, pct_unsolved, vs_city = row
        direction = "+" if vs_city > 0 else ""
        print(f"  {str(hood):<35} {total:>8,} {still_open:>12,} {str(pct_unsolved):>11}% {direction}{vs_city:>10}pp")

# ── 3. Per-neighborhood per-crime-type (the real Lens 3 computation) ──────────
print(f'\n{"=" * WIDTH}')
print(f"Per-neighborhood per-crime-type unsolved rate (occurred before {CUTOFF})")
print("This is the Lens 3 computation — gap vs citywide rate for same crime type")
print(f'{"=" * WIDTH}')

for cat, citywide_row in citywide.items():
    citywide_pct = citywide_row[3]
    print(f"\n  {cat} — citywide unsolved rate: {citywide_pct}%")
    print(f'  {"neighborhood":<35} {"total":>8} {"% unsolved":>12} {"gap vs city":>12}')
    print(f'  {"-"*35} {"-"*8} {"-"*12} {"-"*12}')

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                neighborhood,
                COUNT(*) AS total,
                ROUND(COUNT(*) FILTER (WHERE resolution_latest = 'open') * 100.0 / COUNT(*), 1) AS pct_unsolved
            FROM incidents
            WHERE city = 'sf'
              AND category_primary = %s
              AND occurred_at < %s
              AND neighborhood IS NOT NULL
            GROUP BY neighborhood
            HAVING COUNT(*) >= 20
            ORDER BY pct_unsolved DESC
        """, (cat, CUTOFF))
        for row in cur.fetchall():
            hood, total, pct_unsolved = row
            gap = round(float(pct_unsolved) - float(citywide_pct), 1)
            direction = "+" if gap > 0 else ""
            print(f"  {str(hood):<35} {total:>8,} {str(pct_unsolved):>11}% {direction}{gap:>10}pp")

conn.close()
