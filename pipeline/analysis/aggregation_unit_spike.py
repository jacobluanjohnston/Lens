"""Aggregation unit spike — neighborhoods vs grid.

Answers: should Lens 2 and Lens 3 aggregate by SF Analysis Neighborhoods
(41 polygons, pre-assigned by DataSF) or a custom grid?

Checks:
  1. What % of incidents have a neighborhood value populated?
  2. How even are the counts per neighborhood — any so small they'd be
     statistically meaningless or so large they'd hide variation?
  3. Is there a meaningful geographic spread, or do a handful of
     neighborhoods dominate?

Run from repo root:
  docker run --rm --network lens_default -v "$(pwd):/app" -w "/app" \\
    -e DATABASE_URL=postgresql://lens:lens@db:5432/lens \\
    lens-backend python3 pipeline/analysis/aggregation_unit_spike.py
"""

import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")
WIDTH = 90

conn = psycopg2.connect(DB_URL)

# ── 1. Overall neighborhood coverage ─────────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("1. Neighborhood field coverage")
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT
            COUNT(*)                                                        AS total,
            COUNT(neighborhood)                                             AS with_neighborhood,
            ROUND(COUNT(neighborhood) * 100.0 / COUNT(*), 2)               AS pct_covered,
            COUNT(DISTINCT neighborhood)                                    AS distinct_neighborhoods
        FROM incidents
        WHERE city = 'sf'
    """)
    total, with_nbhd, pct, distinct = cur.fetchone()
    print(f"  Total incidents:              {total:>10,}")
    print(f"  With neighborhood populated:  {with_nbhd:>10,}  ({pct}%)")
    print(f"  Without neighborhood:         {total - with_nbhd:>10,}  ({100 - float(pct):.2f}%)")
    print(f"  Distinct neighborhood values: {distinct:>10,}")

# ── 2. Incidents per neighborhood — distribution ──────────────────────────────
print(f'\n{"=" * WIDTH}')
print("2. Incident count per neighborhood — distribution")
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute("""
        WITH counts AS (
            SELECT neighborhood, COUNT(*) AS n
            FROM incidents
            WHERE city = 'sf' AND neighborhood IS NOT NULL
            GROUP BY neighborhood
        )
        SELECT
            MIN(n)                                                  AS min_count,
            PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY n)::int   AS p10,
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY n)::int   AS p25,
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY n)::int   AS median,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY n)::int   AS p75,
            PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY n)::int   AS p90,
            MAX(n)                                                  AS max_count,
            ROUND(MAX(n)::numeric / MIN(n), 1)                     AS max_min_ratio
        FROM counts
    """)
    row = cur.fetchone()
    min_c, p10, p25, med, p75, p90, max_c, ratio = row
    print(f"  Min:    {min_c:>8,}")
    print(f"  p10:    {p10:>8,}")
    print(f"  p25:    {p25:>8,}")
    print(f"  Median: {med:>8,}")
    print(f"  p75:    {p75:>8,}")
    print(f"  p90:    {p90:>8,}")
    print(f"  Max:    {max_c:>8,}")
    print(f"  Max/min ratio: {ratio}x")

# ── 3. Full neighborhood list sorted by incident count ────────────────────────
print(f'\n{"=" * WIDTH}')
print("3. All neighborhoods by incident count (desc)")
print(f'{"=" * WIDTH}')
print(f'  {"neighborhood":<45} {"incidents":>10} {"% of total":>12}')
print(f'  {"-"*45} {"-"*10} {"-"*12}')

with conn.cursor() as cur:
    cur.execute("""
        WITH counts AS (
            SELECT neighborhood, COUNT(*) AS n
            FROM incidents
            WHERE city = 'sf' AND neighborhood IS NOT NULL
            GROUP BY neighborhood
        ),
        total AS (SELECT SUM(n) AS t FROM counts)
        SELECT neighborhood, n, ROUND(n * 100.0 / t, 2) AS pct
        FROM counts, total
        ORDER BY n DESC
    """)
    for nbhd, n, pct in cur.fetchall():
        print(f"  {str(nbhd):<45} {n:>10,} {str(pct):>11}%")

# ── 4. Smallest neighborhoods — statistical floor check ───────────────────────
print(f'\n{"=" * WIDTH}')
print("4. Smallest neighborhoods — annual average incident count")
print("   (< 500/yr may be too sparse for reliable per-category rates)")
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute("""
        WITH date_range AS (
            SELECT
                MIN(occurred_at) AS min_date,
                MAX(occurred_at) AS max_date,
                EXTRACT(EPOCH FROM (MAX(occurred_at) - MIN(occurred_at)))
                    / (365.25 * 86400) AS years
            FROM incidents
            WHERE city = 'sf'
        ),
        counts AS (
            SELECT neighborhood, COUNT(*) AS n
            FROM incidents
            WHERE city = 'sf' AND neighborhood IS NOT NULL
            GROUP BY neighborhood
        )
        SELECT
            c.neighborhood,
            c.n AS total,
            ROUND(c.n / d.years) AS per_year
        FROM counts c, date_range d
        WHERE c.n / d.years < 500
        ORDER BY per_year ASC
    """)
    rows = cur.fetchall()
    if rows:
        print(f'  {"neighborhood":<45} {"total":>8} {"per year":>10}')
        print(f'  {"-"*45} {"-"*8} {"-"*10}')
        for nbhd, total, per_year in rows:
            print(f"  {str(nbhd):<45} {total:>8,} {per_year:>10,}")
    else:
        print("  All neighborhoods exceed 500 incidents/year — none too sparse.")

# ── 5. Bucket A volume per neighborhood ───────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("5. Bucket A incidents per neighborhood (Burglary, Robbery, Assault, MVT)")
print("   (Lens 3 needs enough per-category volume per neighborhood to be reliable)")
print(f'{"=" * WIDTH}')

BUCKET_A = ('Burglary', 'Robbery', 'Motor Vehicle Theft', 'Assault')

with conn.cursor() as cur:
    cur.execute("""
        WITH counts AS (
            SELECT neighborhood, COUNT(*) AS n
            FROM incidents
            WHERE city = 'sf'
              AND neighborhood IS NOT NULL
              AND category_primary = ANY(%(cats)s)
            GROUP BY neighborhood
        )
        SELECT
            MIN(n)                                                  AS min_count,
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY n)::int   AS p25,
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY n)::int   AS median,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY n)::int   AS p75,
            MAX(n)                                                  AS max_count
        FROM counts
    """, {'cats': list(BUCKET_A)})
    min_c, p25, med, p75, max_c = cur.fetchone()
    print(f"  Min:    {min_c:>8,}")
    print(f"  p25:    {p25:>8,}")
    print(f"  Median: {med:>8,}")
    print(f"  p75:    {p75:>8,}")
    print(f"  Max:    {max_c:>8,}")

print(f'\n{"=" * WIDTH}')
print("Interpretation")
print(f'{"=" * WIDTH}')
print("""
  Neighborhoods win over a grid if:
    - Coverage is high (>90% of incidents have neighborhood populated)
    - No neighborhood is so small it produces unreliable rates (<~200 bucket A
      incidents means per-category clearance rates will be noisy)
    - The existing field is already trusted by DataSF (it is — same field used
      in their published dashboards)

  A grid would only make sense if neighborhoods were very uneven in size AND
  that unevenness materially distorted the lens values. Grid cells have no
  existing population denominator (areal interpolation required from scratch)
  and no pre-assigned values in the incidents table — much more work for
  marginal benefit.

  Write the decision in docs/spikes/aggregation_unit.md.
""")

conn.close()
