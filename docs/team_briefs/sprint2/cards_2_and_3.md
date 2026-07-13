# LENS Data Infrastructure — Cards 2 & 3

> For Ishita. Card 1 (geography dimension table) is done and merged. These are your next two cards.
> Read `docs/team_briefs/sprint2/data_infra.md` for full context on how the project runs locally and how Alembic works.

---

## Card 2 — Precomputed aggregate tables (3pts)

### What this is

A rollup table that pre-aggregates incidents by neighborhood × month × category. This is what all three lens API endpoints read from. Without it, every map view would need to aggregate millions of raw rows live, which would take seconds. With it, every request reads a few thousand pre-computed rows in milliseconds.

### Create the Alembic migration

```bash
cd backend
alembic revision -m "precomputed aggregate tables"
```

In the generated file, write:

```python
def upgrade() -> None:
    op.execute("""
        CREATE TABLE neighborhood_month_rollup (
            neighborhood_id   text    NOT NULL REFERENCES neighborhoods(neighborhood_id),
            month             date    NOT NULL,
            category          text    NOT NULL,
            incident_count    integer NOT NULL DEFAULT 0,
            resolved_count    integer NOT NULL DEFAULT 0,
            arrest_count      integer NOT NULL DEFAULT 0,
            population        integer,
            PRIMARY KEY (neighborhood_id, month, category)
        )
    """)

    op.execute("""
        CREATE INDEX idx_rollup_neighborhood_month
            ON neighborhood_month_rollup (neighborhood_id, month)
    """)

    op.execute("""
        CREATE INDEX idx_rollup_category_month
            ON neighborhood_month_rollup (category, month)
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS neighborhood_month_rollup")
```

**Field explanations:**
- `neighborhood_id` — foreign key to the `neighborhoods` table you built in Card 1
- `month` — always the first day of the month (e.g. `2024-03-01`). Every month gets one row per neighborhood × category.
- `incident_count` — total incidents in this neighborhood, month, and category
- `resolved_count` — incidents where resolution changed to arrest/cite within the per-category window
- `arrest_count` — incidents where the initial filing already had an arrest (used for Lens 2 numerator)
- `population` — copied from `neighborhoods` at build time so each rollup row is self-contained

### Definition of done

```sql
-- Should not be zero after Card 3 runs
SELECT COUNT(*) FROM neighborhood_month_rollup;

-- Migration runs clean with no errors
-- Table exists with the right columns
```

---

## Card 3 — Batch aggregation job (5pts)

### What this is

A Python script that reads from `incidents` + `neighborhoods` and fills `neighborhood_month_rollup`. It runs after every ingest. It is the only thing that writes to the rollup table — the API endpoints only read from it.

### Create the script

`pipeline/aggregations/sf_rollup.py`

```python
"""Batch aggregation job — fills neighborhood_month_rollup from incidents.

Run after every ingest:
  docker run --rm --network lens_default -v "$(pwd):/app" -w "/app" \\
    -e DATABASE_URL=postgresql://lens:lens@db:5432/lens \\
    lens-backend python3 pipeline/aggregations/sf_rollup.py
"""

import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")

conn = psycopg2.connect(DB_URL)

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

conn.commit()
conn.close()
print("Done.")
```

### Definition of done

1. Script runs to completion with no errors.
2. Spot-check three neighborhoods — their monthly count in the rollup must match a direct `COUNT(*)` on `incidents`:

```sql
-- Rollup count for Mission, January 2024, Burglary
SELECT incident_count FROM neighborhood_month_rollup
WHERE neighborhood_id = 'mission'
  AND month = '2024-01-01'
  AND category = 'Burglary';

-- Direct count to verify against — both numbers must match
SELECT COUNT(*) FROM incidents i
JOIN neighborhoods n ON n.neighborhood_name = i.neighborhood
WHERE n.neighborhood_id = 'mission'
  AND DATE_TRUNC('month', i.occurred_at)::date = '2024-01-01'
  AND i.category_primary = 'Burglary';
```

3. Total rollup count is within 5% of total SF incidents with a neighborhood:

```sql
SELECT SUM(incident_count) FROM neighborhood_month_rollup;
SELECT COUNT(*) FROM incidents WHERE city = 'sf' AND neighborhood IS NOT NULL;
```

4. Script is idempotent — running it twice produces the same result (the `ON CONFLICT DO UPDATE` handles this).

---

## What unblocks after these two cards

- Jacob can build `GET /lens/1`, `GET /lens/2`, `GET /lens/3` once Card 3 is done and the rollup table is populated.
- Louisa can wire her frontend to the real API once Jacob's lens endpoints are live.
