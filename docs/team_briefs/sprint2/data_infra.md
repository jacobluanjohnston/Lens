# LENS Data Infrastructure Brief — Sprint 2

> For the new team member taking on the geography dimension table, precomputed aggregate tables, and batch aggregation job.
> Read this in full before writing any code.

---

## Read these first

Before writing a single line of code, read:

1. **`CLAUDE.md`** — the product thesis, guardrails, and tech stack. Especially the guardrails section. This tool exists to expose enforcement bias, not enable it. Every design decision flows from that.
2. **`STATUS.md`** — current state of the project, what's done, what's open, known data gotchas.
3. **`docs/methodology.md`** — what each lens measures and why. You need to understand the denominator choices before building the tables that power them.
4. **`docs/spikes/aggregation_unit.md`** — confirms we use SF Analysis Neighborhoods (41 polygons). Explains the volume floor decision.
5. **`docs/spikes/per_capita_denominator.md`** — confirms no areal interpolation needed (neighborhoods are composed of whole census tracts so ACS tract populations sum exactly). Explains the correct population pipeline (ACS B01003 + 2020 tract-to-neighborhood mapping) and the 4 zero-population neighborhoods.
6. **`docs/api_contract_sprint2.md`** — the API shape the frontend is building against. Your tables power these endpoints.

---

## How the project runs locally

Everything runs in Docker. From the repo root:

```bash
docker compose up
```

This starts:
- `db` — PostgreSQL + PostGIS on port 5432
- `backend` — FastAPI on port 8000
- `frontend` — Next.js on port 5173

To run a Python script against the database:

```bash
docker run --rm --network lens_default -v "$(pwd):/app" -w "/app" \
  -e DATABASE_URL=postgresql://lens:lens@db:5432/lens \
  lens-backend python3 path/to/your/script.py
```

To run Alembic migrations:

```bash
cd backend && alembic upgrade head
```

---

## How Alembic works in this project

**Never edit the database schema by hand.** All schema changes go through Alembic migrations. This keeps every teammate's database in sync.

To create a new migration:

```bash
cd backend
alembic revision -m "describe what this migration does"
```

This creates a new file in `backend/alembic/versions/`. Open it and write your schema changes in the `upgrade()` function (and the reverse in `downgrade()`). Look at `backend/alembic/versions/b3c2d1e4f5a6_raw_reports_and_incidents.py` for the exact pattern — use `op.execute()` with raw SQL, not SQLAlchemy ORM.

Then apply it:

```bash
cd backend && alembic upgrade head
```

CI runs `alembic upgrade head` before every test run, so a broken migration will fail CI immediately.

---

## Card 1 — Geography dimension table (3pts)

### What this is

A table storing the 41 SF Analysis Neighborhood polygons, their names, and their 2020 Census population. Every other table in the system joins to this one. It is the geographic backbone of all three lenses.

### Step 0: Two things to confirm before writing any code

**Slug format for `neighborhood_id` — already decided, use this exactly:**

Generate slugs with: `name.lower().replace('/', '-').replace(' ', '-')`

Examples:
- `Tenderloin` → `tenderloin`
- `Financial District/South Beach` → `financial-district-south-beach`
- `Oceanview/Merced/Ingleside` → `oceanview-merced-ingleside`
- `Bayview Hunters Point` → `bayview-hunters-point`
- `West of Twin Peaks` → `west-of-twin-peaks`

Do not invent a different format. Jacob's API endpoints use the same rule — they join on this key.

**ACS and crosswalk column names — confirmed:**

- ACS B01003 population column: **`B01003001`** (not obvious from the name — it's the Census variable ID)
- ACS GEOID column: **`geoid`** — comes with a `14000US` prefix that must be stripped before joining (e.g. `"14000US06075010100"` → `"06075010100"`)
- Crosswalk neighborhood column: **`neighborhoods_analysis_boundaries`**
- Crosswalk GEOID column: **`geoid`** (no prefix — joins directly after stripping the ACS prefix)

### Step 1: Get the data from DataSF and Census

You need three things:

**Neighborhood polygons (GeoJSON) — the boundary geometry:**
Go to `data.sfgov.org` and search **"Analysis Neighborhoods"**. The dataset you want is the one described as "41 neighborhoods... dissolved to produce this dataset." Dataset ID `p5b7-5n3h`. Click Export → GeoJSON. Save as `data/sf/sf_neighborhoods.geojson`.

This file contains polygon geometry and neighborhood names. It does NOT contain population — that comes from the next two steps.

**Tract-to-neighborhood mapping — the join key:**
On `data.sfgov.org`, search **"Analysis Neighborhoods 2020 census tracts assigned to neighborhoods"**. Download as CSV. This file has a `GEOID` column (the census tract identifier) and a neighborhood name column. It tells you which census tracts belong to which neighborhood.

**Population — from ACS B01003:**
Go to `censusreporter.org`, search "San Francisco", then download table **B01003** (Total Population) at the **census tract** level. This gives you population for each census tract, keyed by GEOID.

Join the ACS file to the tract-to-neighborhood mapping on GEOID, then sum population by neighborhood. Because the 41 neighborhoods are defined as aggregates of whole census tracts (no tract is split), the sum is exact — no areal interpolation needed.

**Do not use the placeholder values in `pipeline/analysis/per_capita_spike.py`** — those were estimates used during the spike, not verified figures.

Verify you have exactly 41 neighborhoods in both files and that the names match the values in the `incidents` table. The exact spellings are:

```
Bayview Hunters Point, Bernal Heights, Castro/Upper Market, Chinatown,
Excelsior, Financial District/South Beach, Glen Park, Golden Gate Park,
Haight Ashbury, Hayes Valley, Inner Richmond, Inner Sunset, Japantown,
Lakeshore, Lincoln Park, Lone Mountain/USF, Marina, McLaren Park, Mission,
Mission Bay, Nob Hill, Noe Valley, North Beach, Oceanview/Merced/Ingleside,
Outer Mission, Outer Richmond, Pacific Heights, Portola, Potrero Hill,
Presidio, Presidio Heights, Russian Hill, Seacliff, South of Market,
Sunset/Parkside, Tenderloin, Treasure Island, Twin Peaks, Visitacion Valley,
Western Addition, West of Twin Peaks
```

Note: it is `Oceanview/Merced/Ingleside` with no space (not "Ocean View").

**The Farallones:** the crosswalk CSV contains a 42nd entry ("The Farallones") with no matching polygon in the GeoJSON. This is expected — they're uninhabited islands technically in SF County. The load script logs and drops them. Do not be alarmed if you see 42 rows in the crosswalk.

### Step 2: Create the Alembic migration

```bash
cd backend
alembic revision -m "geography dimension table"
```

In the generated file, write:

```python
def upgrade() -> None:
    # PostGIS extension (may already exist — IF NOT EXISTS is safe)
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.execute("""
        CREATE TABLE neighborhoods (
            neighborhood_id   text    PRIMARY KEY,
            neighborhood_name text    NOT NULL UNIQUE,
            population        integer,
            per_capita_applicable boolean NOT NULL DEFAULT true,
            low_confidence    boolean NOT NULL DEFAULT false,
            geom              geometry(MultiPolygon, 4326)
        )
    """)

    op.execute("""
        CREATE INDEX idx_neighborhoods_geom
            ON neighborhoods USING GIST (geom)
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS neighborhoods")
```

**Field explanations:**
- `neighborhood_id` — URL-safe slug, lowercase with hyphens, e.g. `tenderloin`, `bayview-hunters-point`. This is the stable join key used by the API.
- `neighborhood_name` — exact string as it appears in the `incidents` table, e.g. `Tenderloin`.
- `population` — 2020 Census population. NULL for the 4 zero-population neighborhoods.
- `per_capita_applicable` — FALSE for: Golden Gate Park, Lincoln Park, McLaren Park, Presidio (parks + military base; per-capita is undefined).
- `low_confidence` — TRUE for the 7 sparse neighborhoods: Presidio, McLaren Park, Seacliff, Lincoln Park, Treasure Island, Twin Peaks, Glen Park. These have fewer than 500 incidents/year — too sparse for reliable per-category Lens 3 rates.
- `geom` — the polygon geometry. Store as `geometry(MultiPolygon, 4326)`. CRS 4326 = WGS84 (standard lat/lon). **Always reproject to 4326 before loading** — mismatched CRS returns wrong containment silently with no error.

### Step 3: Write the load script

Create `pipeline/adapters/sf/load_neighborhoods.py`. Use GeoPandas to read the GeoJSON and psycopg2 to load it:

```python
import geopandas as gpd
import psycopg2
import os

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")

# Read and reproject to WGS84 (4326)
gdf = gpd.read_file("data/sf/sf_neighborhoods.geojson").to_crs(epsg=4326)

# Load population from the DataSF CSV
# Join on neighborhood name to get population per row

conn = psycopg2.connect(DB_URL)
with conn.cursor() as cur:
    for _, row in gdf.iterrows():
        cur.execute("""
            INSERT INTO neighborhoods
                (neighborhood_id, neighborhood_name, population,
                 per_capita_applicable, low_confidence, geom)
            VALUES (%s, %s, %s, %s, %s, ST_Multi(ST_GeomFromGeoJSON(%s)))
            ON CONFLICT (neighborhood_id) DO NOTHING
        """, (
            slugify(row['nhood']),   # derive slug from name
            row['nhood'],
            population_lookup[row['nhood']],
            row['nhood'] not in ZERO_POP,
            row['nhood'] in LOW_CONFIDENCE,
            row.geometry.__geo_interface__,  # GeoJSON string for ST_GeomFromGeoJSON
        ))
conn.commit()
conn.close()
```

Define `ZERO_POP` and `LOW_CONFIDENCE` as sets matching the neighborhood names exactly:

```python
ZERO_POP = {'Golden Gate Park', 'Lincoln Park', 'McLaren Park', 'Presidio'}

LOW_CONFIDENCE = {
    'Presidio', 'McLaren Park', 'Seacliff', 'Lincoln Park',
    'Treasure Island', 'Twin Peaks', 'Glen Park'
}
```

### Definition of done

Run these queries. Every one must pass:

```sql
-- Must be exactly 41
SELECT COUNT(*) FROM neighborhoods;

-- Must be 0 — no nulls except the 4 zero-pop neighborhoods
SELECT COUNT(*) FROM neighborhoods
WHERE geom IS NULL;

-- Must be 4
SELECT COUNT(*) FROM neighborhoods
WHERE per_capita_applicable = false;

-- Must be 7
SELECT COUNT(*) FROM neighborhoods
WHERE low_confidence = true;

-- Must be 0 — every name in incidents must match a neighborhood row
SELECT DISTINCT i.neighborhood
FROM incidents i
LEFT JOIN neighborhoods n ON n.neighborhood_name = i.neighborhood
WHERE i.neighborhood IS NOT NULL AND n.neighborhood_id IS NULL;

-- Must be 4326 for all rows
SELECT DISTINCT ST_SRID(geom) FROM neighborhoods;
```

---

## Card 2 — Precomputed aggregate tables (3pts)

### What this is

A rollup table that pre-aggregates incidents by neighborhood × month × category. This is what all three lens API endpoints read from. Without it, every map view would need to aggregate millions of raw rows live, which would take seconds. With it, every request reads a few thousand pre-computed rows in milliseconds.

### Why this design

The performance target is all API responses under ~200ms. Live `GROUP BY` across 745k incidents with a category filter and a date range takes 2–5 seconds. This rollup reduces every lens query to a simple `SELECT` on a small table.

### Create the Alembic migration

```bash
cd backend
alembic revision -m "precomputed aggregate tables"
```

```python
def upgrade() -> None:
    op.execute("""
        CREATE TABLE neighborhood_month_rollup (
            neighborhood_id   text    NOT NULL REFERENCES neighborhoods(neighborhood_id),
            month             date    NOT NULL,  -- always the 1st of the month, e.g. 2024-03-01
            category          text    NOT NULL,
            incident_count    integer NOT NULL DEFAULT 0,
            resolved_count    integer NOT NULL DEFAULT 0,
            arrest_count      integer NOT NULL DEFAULT 0,
            population        integer,           -- copied from neighborhoods at build time
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
- `month` — always the first day of the month (`DATE_TRUNC('month', occurred_at)::date`). This is the time grain — every month gets one row per neighborhood × category.
- `incident_count` — total incidents in this neighborhood, month, and category.
- `resolved_count` — incidents where `resolution_latest = 'arrest_cite'` AND the resolution-changing supplement arrived within the per-category N-day window (MVT 30d, Assault 150d, Burglary 180d, Robbery 190d). See `docs/spikes/g2_window_selection.md` for where these numbers come from.
- `arrest_count` — incidents where `resolution_initial = 'arrest_cite'` (at-filing arrest). Used for Lens 2 numerator.
- `population` — the neighborhood population, copied from the `neighborhoods` table at build time so each rollup row is self-contained.

### Definition of done

```sql
-- Should equal the number of distinct (neighborhood × month × category) combinations
-- in the incidents table. Check it's not zero.
SELECT COUNT(*) FROM neighborhood_month_rollup;

-- Spot check: Mission, January 2024, Burglary
-- Should match a direct COUNT on incidents
SELECT incident_count FROM neighborhood_month_rollup
WHERE neighborhood_id = 'mission'
  AND month = '2024-01-01'
  AND category = 'Burglary';

-- Direct count to verify against
SELECT COUNT(*) FROM incidents i
JOIN neighborhoods n ON n.neighborhood_name = i.neighborhood
WHERE n.neighborhood_id = 'mission'
  AND DATE_TRUNC('month', i.occurred_at)::date = '2024-01-01'
  AND i.category_primary = 'Burglary';

-- Both numbers must match.

-- No null neighborhood_ids
SELECT COUNT(*) FROM neighborhood_month_rollup WHERE neighborhood_id IS NULL;
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

# Per-category resolution windows from G2 spike (docs/spikes/g2_window_selection.md)
RESOLUTION_WINDOWS = {
    'Motor Vehicle Theft': 30,
    'Assault':             150,
    'Burglary':            180,
    'Robbery':             190,
}

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
                -- resolved_count only counts cases where supplement arrived
                -- within the per-category N-day window.
                -- Cases outside the window are provisional, not unsolved.
                -- NOTE: full per-category window filtering requires a join
                -- to raw_reports to get the supplement date. For now,
                -- count all resolved cases and add window filtering in Sprint 3
                -- once assault surgery is complete.
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

**Important note on `resolved_count`:** The full N-day window logic (only count a case as resolved if the supplement arrived within N days) requires knowing the date of the resolution-changing supplement. That join is built as part of the assault surgery work (a separate card). For Sprint 2, `resolved_count` counts all cases where `resolution_changed = true`. The assault surgery card will refine this. Document this limitation with a comment in the script — do not silently implement it incorrectly.

### Definition of done

1. Script runs to completion with no errors.
2. Spot-check three neighborhoods against direct `COUNT(*)` queries on `incidents` and the numbers match.
3. `SELECT SUM(incident_count) FROM neighborhood_month_rollup` is within 5% of `SELECT COUNT(*) FROM incidents WHERE city = 'sf' AND neighborhood IS NOT NULL` — the difference is incidents in the 4.93% of rows with no neighborhood, which are correctly excluded.
4. The script is idempotent — running it twice produces the same result (the `ON CONFLICT DO UPDATE` handles this).

---

## Things you must not do

- **Do not hand-edit the database schema.** All changes go through Alembic migrations. If you run `CREATE TABLE` directly in psql, your teammates' databases won't have it and CI will fail.
- **Do not use the placeholder population numbers in `pipeline/analysis/per_capita_spike.py`.** Those were estimates. Pull the real numbers from DataSF.
- **Do not silently drop records.** If a neighborhood name in `incidents` doesn't match a row in `neighborhoods`, log how many rows were excluded and why. Uneven exclusion is a data quality signal.
- **Do not invent a new aggregation unit.** The decision (SF Analysis Neighborhoods, 41 polygons) was made in a spike and is documented. If you think there's a problem with it, raise it — don't just change it.
- **Do not reproject to anything other than EPSG:4326 (WGS84).** Mismatched CRS returns wrong spatial results silently.

---
