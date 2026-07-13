import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")

conn = psycopg2.connect(DB_URL)
try:
    print("Truncating rollup table...")
    with conn.cursor() as cur:
        cur.execute("TRUNCATE neighborhood_month_rollup")

    print("Building rollup...")
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO neighborhood_month_rollup
                (neighborhood_id, month, category, incident_count,
                 resolved_count, arrest_count, population)
            SELECT
                n.neighborhood_id,
                DATE_TRUNC('month', i.occurred_at)::date   AS month,
                i.category_primary                          AS category,
                COUNT(*)                                    AS incident_count,
                COUNT(*) FILTER (
                    WHERE i.resolution_latest = 'arrest_cite'
                      AND i.resolution_changed = true
                    -- NOTE: full per-category window filtering (MVT 30d, Assault 150d,
                    -- Burglary 180d, Robbery 190d) requires the assault surgery card.
                    -- For now, count all resolved cases. Sprint 3 will refine this.
                )                                           AS resolved_count,
                COUNT(*) FILTER (
                    WHERE i.resolution_initial = 'arrest_cite'
                )                                           AS arrest_count,
                n.population
            FROM incidents i
            JOIN neighborhoods n ON n.neighborhood_name = i.neighborhood
            WHERE i.city = 'sf'
              AND i.occurred_at IS NOT NULL
              AND i.neighborhood IS NOT NULL
            GROUP BY n.neighborhood_id, month, i.category_primary, n.population
            ON CONFLICT (neighborhood_id, month, category)
                DO UPDATE SET
                    incident_count = EXCLUDED.incident_count,
                    resolved_count = EXCLUDED.resolved_count,
                    arrest_count   = EXCLUDED.arrest_count,
                    population     = EXCLUDED.population
        """)
        rows = cur.rowcount
        print(f"Inserted/updated {rows:,} rollup rows.")

    # Guardrail: surface any neighborhood names that failed to match
    with conn.cursor() as cur:
        cur.execute("""
            SELECT i.neighborhood, COUNT(*) AS n
            FROM incidents i
            LEFT JOIN neighborhoods n ON n.neighborhood_name = i.neighborhood
            WHERE i.city = 'sf'
              AND i.neighborhood IS NOT NULL
              AND n.neighborhood_id IS NULL
            GROUP BY i.neighborhood
            ORDER BY n DESC
        """)
        unmatched = cur.fetchall()
    if unmatched:
        total_unmatched = sum(n for _, n in unmatched)
        print(f"WARNING: {total_unmatched:,} incidents have a neighborhood "
              f"name with no match in neighborhoods table:")
        for name, n in unmatched:
            print(f"  {name!r}: {n:,}")

    conn.commit()
except Exception:
    conn.rollback()
    raise
finally:
    conn.close()
print("Done.")