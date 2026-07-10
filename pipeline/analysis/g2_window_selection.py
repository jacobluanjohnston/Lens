"""G2 validation — window N selection for Lens 3.

Lens 3 measures whether a serious crime got solved "within N days." This script
finds N by looking at how long it actually takes for resolution-changing supplements
to arrive for bucket A crimes (Burglary, Robbery, Assault, Motor Vehicle Theft).

We pick N at the 90th percentile — the point where 90% of cases that will ever
get resolved have already been resolved. Cases beyond N are marked provisional.

Run from repo root:
  docker run --rm --network lens_default -v "$(pwd):/app" -w "/app" \\
    -e DATABASE_URL=postgresql://lens:lens@db:5432/lens \\
    lens-backend python3 pipeline/analysis/g2_window_selection.py
"""

import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")
WIDTH = 90
BUCKET_A = ('Burglary', 'Robbery', 'Motor Vehicle Theft', 'Assault')

conn = psycopg2.connect(DB_URL)

# ── Build the days-to-resolution dataset ─────────────────────────────────────
# For each bucket A case where resolution changed:
#   - initial_date = reported_at of the earliest non-supplement report
#   - change_date  = reported_at of the earliest supplement with a different resolution
#   - days         = change_date - initial_date

DAYS_QUERY = """
WITH bucket_a_changed AS (
    SELECT incident_number, resolution_initial, category_primary
    FROM incidents
    WHERE city = 'sf'
      AND resolution_changed = true
      AND category_primary = ANY(%(cats)s)
),
initial_dates AS (
    SELECT r.incident_number, MIN(r.reported_at) AS initial_date
    FROM raw_reports r
    JOIN bucket_a_changed b ON b.incident_number = r.incident_number
    WHERE r.city = 'sf' AND r.dataset = 'current'
      AND r.report_type NOT ILIKE '%%Supplement%%'
    GROUP BY r.incident_number
),
resolution_change_dates AS (
    SELECT DISTINCT ON (r.incident_number)
        r.incident_number,
        r.reported_at AS change_date
    FROM raw_reports r
    JOIN bucket_a_changed b ON b.incident_number = r.incident_number
    WHERE r.city = 'sf' AND r.dataset = 'current'
      AND r.report_type ILIKE '%%Supplement%%'
      AND r.resolution IS NOT NULL
      AND r.resolution != b.resolution_initial
    ORDER BY r.incident_number, r.reported_at ASC
)
SELECT
    b.category_primary,
    EXTRACT(DAY FROM (rcd.change_date - id.initial_date))::int AS days
FROM initial_dates id
JOIN resolution_change_dates rcd ON rcd.incident_number = id.incident_number
JOIN bucket_a_changed b ON b.incident_number = id.incident_number
WHERE rcd.change_date > id.initial_date
"""

# ── 1. Percentile distribution overall ───────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("G2a: Days-to-resolution percentiles — all bucket A categories combined")
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute(f"""
        WITH base AS ({DAYS_QUERY})
        SELECT
            COUNT(*)                                                    AS total_cases,
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY days)::int    AS p50,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY days)::int    AS p75,
            PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY days)::int    AS p80,
            PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY days)::int    AS p90,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY days)::int    AS p95,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY days)::int    AS p99,
            MAX(days)                                                   AS max_days
        FROM base
    """, {'cats': list(BUCKET_A)})
    row = cur.fetchone()
    total, p50, p75, p80, p90, p95, p99, max_days = row
    print(f"  Total cases with resolution change: {total:,}")
    print(f"  50th percentile (median):           {p50} days")
    print(f"  75th percentile:                    {p75} days")
    print(f"  80th percentile:                    {p80} days")
    print(f"  90th percentile:                    {p90} days  ← candidate N")
    print(f"  95th percentile:                    {p95} days")
    print(f"  99th percentile:                    {p99} days")
    print(f"  Max:                                {max_days} days")

# ── 2. Cumulative % resolved by common thresholds ────────────────────────────
print(f'\n{"=" * WIDTH}')
print("G2b: Cumulative % of cases resolved by threshold (all bucket A)")
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute(f"""
        WITH base AS ({DAYS_QUERY}),
        thresholds(t) AS (VALUES (30),(60),(90),(120),(180),(270),(365))
        SELECT
            t,
            COUNT(*) FILTER (WHERE days <= t) AS resolved_by,
            COUNT(*) AS total,
            ROUND(COUNT(*) FILTER (WHERE days <= t) * 100.0 / COUNT(*), 1) AS pct
        FROM base CROSS JOIN thresholds
        GROUP BY t
        ORDER BY t
    """, {'cats': list(BUCKET_A)})
    print(f"  {'Threshold':>12}  {'Resolved':>10}  {'Total':>10}  {'% resolved':>12}")
    print(f"  {'-'*12}  {'-'*10}  {'-'*10}  {'-'*12}")
    for t, resolved, total, pct in cur.fetchall():
        marker = "  ← 90%" if pct >= 90 and pct < 95 else ""
        print(f"  {t:>9} days  {resolved:>10,}  {total:>10,}  {pct:>11}%{marker}")

# ── 3. Breakdown by category ──────────────────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("G2c: 90th percentile by category")
print("(Lens 3 may need per-category N if distributions differ significantly)")
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute(f"""
        WITH base AS ({DAYS_QUERY})
        SELECT
            category_primary,
            COUNT(*)                                                    AS total,
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY days)::int    AS p50,
            PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY days)::int    AS p90,
            MAX(days)                                                   AS max_days
        FROM base
        GROUP BY category_primary
        ORDER BY p90
    """, {'cats': list(BUCKET_A)})
    print(f"  {'category':<30} {'total':>8} {'p50 days':>10} {'p90 days':>10} {'max days':>10}")
    print(f"  {'-'*30} {'-'*8} {'-'*10} {'-'*10} {'-'*10}")
    for cat, total, p50, p90, max_days in cur.fetchall():
        print(f"  {str(cat):<30} {total:>8,} {p50:>10} {p90:>10} {max_days:>10}")

print(f'\n{"=" * WIDTH}')
print("Interpretation")
print(f'{"=" * WIDTH}')
print("""
  N = the 90th percentile value from G2a. Cases where the resolution-changing
  supplement arrives after N days are marked provisional in Lens 3.

  If per-category p90 values differ significantly (G2c), consider separate N
  per crime type rather than one global value. A burglary that takes 6 months
  to close is different from an assault that closes in days.

  Right-censoring note: recent cases (trailing 60-90 days) have not had time
  to accumulate supplements. The distribution here is based on historical cases
  only and should be re-run after each major data refresh.
""")

conn.close()
