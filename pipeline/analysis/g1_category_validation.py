"""G1 validation — category screen table.

Runs the four G1 checks against the loaded incidents and raw_reports tables:
  1. At-filing arrest share per category (from incidents.resolution_initial)
  2. Supplement lift per category (share of supplemented cases where resolution changed)
  3. Coplogic share per category (from raw_reports.report_type on initial rows only)

Findings inform bucket assignments for Lens 2 and confirm the Lens 3 join is worthwhile.
See docs/adr/001_category_bucket_assignments.md for the outcome of this run.

Run from repo root:
  docker run --rm --network lens_default -v "$(pwd):/app" -w "/app" \\
    -e DATABASE_URL=postgresql://lens:lens@db:5432/lens \\
    lens-backend python3 pipeline/analysis/g1_category_validation.py
"""

import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")
WIDTH = 100

conn = psycopg2.connect(DB_URL)

# ── 1. At-filing arrest share + supplement lift per category ──────────────────
print(f'\n{"=" * WIDTH}')
print("G1a: At-filing arrest share and supplement lift per category")
print("(from incidents table — resolution_initial and resolution_changed)")
print(f'{"=" * WIDTH}')
print(f'  {"category":<50} {"total":>8} {"% arrest at filing":>20} {"has_supp":>10} {"% lift":>10}')
print(f'  {"-"*50} {"-"*8} {"-"*20} {"-"*10} {"-"*10}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT
            category_primary,
            COUNT(*) AS total,
            ROUND(COUNT(*) FILTER (WHERE resolution_initial = 'arrest_cite') * 100.0 / COUNT(*), 1)
                AS pct_arrest_at_filing,
            COUNT(*) FILTER (WHERE has_supplement) AS has_supplement,
            ROUND(
                COUNT(*) FILTER (WHERE resolution_changed) * 100.0 /
                NULLIF(COUNT(*) FILTER (WHERE has_supplement), 0), 1
            ) AS pct_lift_from_supplement
        FROM incidents
        WHERE city = 'sf'
        GROUP BY category_primary
        ORDER BY pct_arrest_at_filing DESC
    """)
    for row in cur.fetchall():
        cat, total, pct_arrest, has_supp, pct_lift = row
        print(f"  {str(cat):<50} {total:>8,} {str(pct_arrest):>20} {has_supp:>10,} {str(pct_lift):>10}")

# ── 2. Coplogic share per category ────────────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("G1b: Coplogic share per category")
print("(from raw_reports, current dataset, initial rows only)")
print("Note: Coplogic portal only supports certain crime types — 0% for unsupported")
print("categories does not confirm officer-initiation on its own.")
print(f'{"=" * WIDTH}')
print(f'  {"category":<50} {"total initial rows":>20} {"% coplogic":>12}')
print(f'  {"-"*50} {"-"*20} {"-"*12}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT
            category,
            COUNT(*) AS total_initial_rows,
            ROUND(
                COUNT(*) FILTER (WHERE report_type ILIKE '%Coplogic%') * 100.0 / COUNT(*), 1
            ) AS pct_coplogic
        FROM raw_reports
        WHERE city = 'sf' AND dataset = 'current'
          AND report_type NOT ILIKE '%Supplement%'
        GROUP BY category
        ORDER BY pct_coplogic DESC, total_initial_rows DESC
    """)
    for row in cur.fetchall():
        cat, total, pct_coplogic = row
        print(f"  {str(cat):<50} {total:>20,} {str(pct_coplogic):>12}")

print(f'\n{"=" * WIDTH}')
print("Interpretation notes")
print(f'{"=" * WIDTH}')
print("""
  At-filing arrest is a CORRELATOR, not proof of officer-initiation. A civilian
  can call 911 about a drug deal; the officer responds and arrests — that report
  also shows at-filing arrest. Use in combination with Coplogic share and the
  conceptual station test, not in isolation.

  Coplogic check has limited discriminatory power: the portal only supports certain
  property crime types. Nearly all categories show 0% regardless of officer-initiation.
  The check is most useful for confirming Larceny and Lost Property are victim-driven.

  The meaningful signal is the BIMODAL DISTRIBUTION:
    - Clear victim cluster:   Burglary 4.3%, MVT 2.9%, Robbery 9.8%
    - Clear officer cluster:  Drug Offense 93.5%, Warrant 96.1%, Prostitution 87.4%
    - Ambiguous middle:       Disorderly Conduct 27.8%, Civil Sidewalks 70.8%

  Categories confirmed in bucket B (core): Drug Offense, Drug Violation, Warrant,
  Prostitution, Traffic Violation Arrest, Weapons Carrying.
  Removed: Disorderly Conduct (27.8% — not clearly officer-initiated).
  Sensitivity only: Civil Sidewalks (70.8%), Stolen Property (67.9%).
""")

conn.close()
