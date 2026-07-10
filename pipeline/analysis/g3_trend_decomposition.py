"""G3 validation — resolution rate trend decomposition.

The overall resolution rate rose sharply from ~22% to ~41% between August 2024
and June 2026. This script determines whether that rise is:

  A) Composition shift — the MIX of crime types changed (fewer low-clearance
     categories, more high-clearance ones), making the overall rate rise even
     if per-category rates stayed flat. Lens 3 is immune to this — it compares
     within crime type.

  B) Within-category change — clearance rates for individual crime types
     actually changed. This is a real signal that must be disclosed.

Method: freeze the category composition at a pre-August-2024 baseline and
apply it to post-August-2024 counts. If the frozen-weight rate matches the
observed rise, it's composition. If the observed rate rises further, it's
within-category.

Run from repo root:
  docker run --rm --network lens_default -v "$(pwd):/app" -w "/app" \\
    -e DATABASE_URL=postgresql://lens:lens@db:5432/lens \\
    lens-backend python3 pipeline/analysis/g3_trend_decomposition.py
"""

import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")
WIDTH = 100
BREAKPOINT = '2024-08-01'

conn = psycopg2.connect(DB_URL)

# ── 1. Overall resolution rate by month ───────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("G3a: Overall resolution rate by month (all categories, last 36 months)")
print(f'{"=" * WIDTH}')
print(f'  {"month":<12} {"total":>8} {"resolved":>10} {"rate":>8}')
print(f'  {"-"*12} {"-"*8} {"-"*10} {"-"*8}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT
            DATE_TRUNC('month', occurred_at)::date AS month,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE resolution_latest = 'arrest_cite') AS resolved,
            ROUND(COUNT(*) FILTER (WHERE resolution_latest = 'arrest_cite') * 100.0 / COUNT(*), 1) AS rate
        FROM incidents
        WHERE city = 'sf'
          AND occurred_at >= NOW() - INTERVAL '36 months'
        GROUP BY 1
        ORDER BY 1
    """)
    for month, total, resolved, rate in cur.fetchall():
        marker = " ← breakpoint" if str(month) == BREAKPOINT else ""
        print(f"  {str(month):<12} {total:>8,} {resolved:>10,} {rate:>7}%{marker}")

# ── 2. Per-category resolution rate by period ─────────────────────────────────
print(f'\n{"=" * WIDTH}')
print(f'G3b: Per-category resolution rate — before vs after {BREAKPOINT}')
print(f'{"=" * WIDTH}')
print(f'  {"category":<45} {"before rate":>12} {"after rate":>12} {"change":>8}')
print(f'  {"-"*45} {"-"*12} {"-"*12} {"-"*8}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT
            category_primary,
            ROUND(COUNT(*) FILTER (
                WHERE occurred_at < %(bp)s AND resolution_latest = 'arrest_cite'
            ) * 100.0 / NULLIF(COUNT(*) FILTER (WHERE occurred_at < %(bp)s), 0), 1) AS rate_before,
            ROUND(COUNT(*) FILTER (
                WHERE occurred_at >= %(bp)s AND resolution_latest = 'arrest_cite'
            ) * 100.0 / NULLIF(COUNT(*) FILTER (WHERE occurred_at >= %(bp)s), 0), 1) AS rate_after,
            COUNT(*) FILTER (WHERE occurred_at < %(bp)s) AS n_before,
            COUNT(*) FILTER (WHERE occurred_at >= %(bp)s) AS n_after
        FROM incidents
        WHERE city = 'sf'
        GROUP BY category_primary
        HAVING COUNT(*) FILTER (WHERE occurred_at < %(bp)s) > 100
           AND COUNT(*) FILTER (WHERE occurred_at >= %(bp)s) > 100
        ORDER BY ABS(
            COALESCE(ROUND(COUNT(*) FILTER (
                WHERE occurred_at >= %(bp)s AND resolution_latest = 'arrest_cite'
            ) * 100.0 / NULLIF(COUNT(*) FILTER (WHERE occurred_at >= %(bp)s), 0), 1), 0)
            -
            COALESCE(ROUND(COUNT(*) FILTER (
                WHERE occurred_at < %(bp)s AND resolution_latest = 'arrest_cite'
            ) * 100.0 / NULLIF(COUNT(*) FILTER (WHERE occurred_at < %(bp)s), 0), 1), 0)
        ) DESC
    """, {'bp': BREAKPOINT})
    for cat, rate_before, rate_after, n_before, n_after in cur.fetchall():
        if rate_before is None or rate_after is None:
            continue
        change = float(rate_after) - float(rate_before)
        marker = " ▲" if change > 5 else (" ▼" if change < -5 else "")
        print(f"  {str(cat):<45} {str(rate_before):>11}% {str(rate_after):>11}% {change:>+7.1f}pp{marker}")

# ── 3. Composition shift test ─────────────────────────────────────────────────
# Apply pre-breakpoint category MIX to post-breakpoint counts.
# If frozen-weight rate ≈ observed post rate → composition explains it.
# If observed post rate > frozen-weight rate → within-category change is real.
print(f'\n{"=" * WIDTH}')
print("G3c: Composition shift test")
print(f'  Freeze pre-{BREAKPOINT} category weights, apply to post-{BREAKPOINT} volume.')
print(f'  If frozen-weight rate ≈ observed rate → composition explains the rise.')
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute("""
        WITH before AS (
            SELECT
                category_primary,
                COUNT(*) AS n,
                COUNT(*) FILTER (WHERE resolution_latest = 'arrest_cite') AS resolved
            FROM incidents
            WHERE city = 'sf' AND occurred_at < %(bp)s
            GROUP BY category_primary
        ),
        after AS (
            SELECT
                category_primary,
                COUNT(*) AS n,
                COUNT(*) FILTER (WHERE resolution_latest = 'arrest_cite') AS resolved
            FROM incidents
            WHERE city = 'sf' AND occurred_at >= %(bp)s
            GROUP BY category_primary
        ),
        totals AS (
            SELECT
                SUM(b.n) AS total_before,
                SUM(a.n) AS total_after,
                -- Observed overall rates
                ROUND((SUM(b.resolved) * 100.0 / SUM(b.n))::numeric, 1) AS rate_before,
                ROUND((SUM(a.resolved) * 100.0 / SUM(a.n))::numeric, 1) AS rate_after,
                -- Frozen-weight rate: pre-period category rates × post-period category shares
                ROUND((SUM(
                    (b.resolved::float / NULLIF(b.n, 0))
                    * a.n
                ) * 100.0 / SUM(a.n))::numeric, 1) AS frozen_weight_rate
            FROM before b
            JOIN after a USING (category_primary)
        )
        SELECT rate_before, rate_after, frozen_weight_rate,
               ROUND((rate_after - rate_before)::numeric, 1) AS observed_change,
               ROUND((frozen_weight_rate - rate_before)::numeric, 1) AS composition_explains,
               ROUND((rate_after - frozen_weight_rate)::numeric, 1) AS within_category_change
        FROM totals
    """, {'bp': BREAKPOINT})
    row = cur.fetchone()
    rate_before, rate_after, frozen, observed, comp, within = row
    print(f"  Overall rate before {BREAKPOINT}:          {rate_before}%")
    print(f"  Overall rate after  {BREAKPOINT}:          {rate_after}%")
    print(f"  Observed change:                          +{observed}pp")
    print()
    print(f"  Frozen-weight rate (composition test):    {frozen}%")
    print(f"  Change explained by composition shift:    +{comp}pp")
    print(f"  Residual within-category change:          +{within}pp")
    print()
    if abs(float(within)) <= 2:
        print("  RESULT: Composition shift explains the rise. Lens 3 is immune.")
        print("          Per-category clearance rates are stable.")
    elif abs(float(within)) <= 5:
        print("  RESULT: Mixed. Composition explains most of the rise but a small")
        print("          within-category component remains. Disclose in methodology.")
    else:
        print("  RESULT: Within-category change is real and significant.")
        print("          Before/after claims in Lens 3 must be frozen until investigated.")

conn.close()
