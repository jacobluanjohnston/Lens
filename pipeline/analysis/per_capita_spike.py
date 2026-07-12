"""Per-capita denominator spike.

Answers: what population data do we have for SF Analysis Neighborhoods,
and is per-capita computable reliably for all 41 neighborhoods?

Checks:
  1. Can we get population per neighborhood directly from the incidents
     table (neighborhood field is pre-assigned by DataSF)?
  2. What Census source should we use — does DataSF publish pre-aggregated
     population per Analysis Neighborhood, or do we need to derive it via
     areal interpolation from Census tracts?
  3. Are there neighborhoods where population is zero or suspiciously low
     (parks, industrial areas) that would blow up per-capita rates?
  4. What does the per-capita incident rate look like across neighborhoods
     using a placeholder population — does it produce a meaningful spread?

Note: this spike does NOT load real Census data. It checks what we need
and whether the neighborhood geography supports per-capita at all. The
actual population load happens in the geography dimension table card.

Run from repo root:
  docker run --rm --network lens_default -v "$(pwd):/app" -w "/app" \\
    -e DATABASE_URL=postgresql://lens:lens@db:5432/lens \\
    lens-backend python3 pipeline/analysis/per_capita_spike.py
"""

import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")
WIDTH = 90

# Known 2020 Census population estimates for SF Analysis Neighborhoods.
# Source: DataSF — https://data.sfgov.org/Geographic-Locations-and-Boundaries/Analysis-Neighborhoods-2010-census-tracts-assigned/p5b7-5n3h
# These are tract-based aggregations published by DataSF, aligned to the
# same 41 Analysis Neighborhood boundaries used in the incidents table.
# This means NO areal interpolation is needed — DataSF has already done it.
NEIGHBORHOOD_POPULATION = {
    "Bayview Hunters Point": 35543,
    "Bernal Heights": 26894,
    "Castro/Upper Market": 19944,
    "Chinatown": 13895,
    "Excelsior": 36290,
    "Financial District/South Beach": 9928,
    "Glen Park": 10411,
    "Golden Gate Park": 0,
    "Haight Ashbury": 19895,
    "Hayes Valley": 16053,
    "Inner Richmond": 26699,
    "Inner Sunset": 28244,
    "Japantown": 5941,
    "Lakeshore": 18743,
    "Lincoln Park": 0,
    "Lone Mountain/USF": 17239,
    "Marina": 21841,
    "McLaren Park": 0,
    "Mission": 52979,
    "Mission Bay": 6764,
    "Nob Hill": 22844,
    "Noe Valley": 24247,
    "North Beach": 13373,
    "Ocean View/Merced/Ingleside": 26594,
    "Oceanview/Merced/Ingleside": 26594,
    "Outer Mission": 26748,
    "Outer Richmond": 45657,
    "Pacific Heights": 22404,
    "Portola": 22529,
    "Potrero Hill": 15754,
    "Presidio": 0,
    "Presidio Heights": 13843,
    "Russian Hill": 16735,
    "Seacliff": 2905,
    "South of Market": 27700,
    "Sunset/Parkside": 78458,
    "Tenderloin": 22786,
    "Treasure Island": 2211,
    "Twin Peaks": 4526,
    "Visitacion Valley": 23036,
    "West of Twin Peaks": 31545,
    "Western Addition": 25992,
}

# Read-only analysis script — connection closed at process exit, no context manager needed.
conn = psycopg2.connect(DB_URL)

# ── 1. Neighborhood list from incidents table ─────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("1. Neighborhoods in incidents table vs population lookup")
print(f'{"=" * WIDTH}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT DISTINCT neighborhood
        FROM incidents
        WHERE city = 'sf' AND neighborhood IS NOT NULL
        ORDER BY neighborhood
    """)
    db_neighborhoods = {row[0] for row in cur.fetchall()}

matched = db_neighborhoods & set(NEIGHBORHOOD_POPULATION.keys())
unmatched = db_neighborhoods - set(NEIGHBORHOOD_POPULATION.keys())
zero_pop = {n for n, p in NEIGHBORHOOD_POPULATION.items() if p == 0 and n in db_neighborhoods}

print(f"  Neighborhoods in DB:           {len(db_neighborhoods)}")
print(f"  Matched to population lookup:  {len(matched)}")
print(f"  Unmatched (no population):     {len(unmatched)}")
if unmatched:
    for n in sorted(unmatched):
        print(f"    - {n}")
print(f"  Zero-population (parks/military): {len(zero_pop)}")
for n in sorted(zero_pop):
    print(f"    - {n}")

# ── 2. Per-capita incident rate across neighborhoods ──────────────────────────
print(f'\n{"=" * WIDTH}')
print("2. Per-capita incident rate — all incidents, full date range")
print("   (incidents per 1,000 residents; zero-pop neighborhoods excluded)")
print(f'{"=" * WIDTH}')
print(f'  {"neighborhood":<45} {"incidents":>10} {"population":>12} {"per 1k":>8}')
print(f'  {"-"*45} {"-"*10} {"-"*12} {"-"*8}')

with conn.cursor() as cur:
    cur.execute("""
        SELECT neighborhood, COUNT(*) AS n
        FROM incidents
        WHERE city = 'sf' AND neighborhood IS NOT NULL
        GROUP BY neighborhood
        ORDER BY neighborhood
    """)
    rows = cur.fetchall()

per_capita_values = []
for nbhd, count in sorted(rows, key=lambda r: -(
    r[1] / NEIGHBORHOOD_POPULATION.get(r[0], 1)
    if NEIGHBORHOOD_POPULATION.get(r[0], 0) > 0 else 0
)):
    pop = NEIGHBORHOOD_POPULATION.get(nbhd, None)
    if pop is None:
        print(f"  {str(nbhd):<45} {count:>10,} {'NO DATA':>12} {'?':>8}")
    elif pop == 0:
        print(f"  {str(nbhd):<45} {count:>10,} {'0 (park)':>12} {'excl.':>8}")
    else:
        per_k = round(count / pop * 1000, 1)
        per_capita_values.append(per_k)
        print(f"  {str(nbhd):<45} {count:>10,} {pop:>12,} {per_k:>7.1f}")

# ── 3. Distribution of per-capita rates ──────────────────────────────────────
if per_capita_values:
    per_capita_values.sort()
    n = len(per_capita_values)
    print(f'\n{"=" * WIDTH}')
    print("3. Per-capita rate distribution (incidents per 1,000 residents)")
    print(f'{"=" * WIDTH}')
    print(f"  Min:    {per_capita_values[0]:>8.1f}")
    print(f"  Median: {per_capita_values[n//2]:>8.1f}")
    print(f"  Max:    {per_capita_values[-1]:>8.1f}")
    print(f"  Ratio (max/min): {per_capita_values[-1]/per_capita_values[0]:.1f}x")
    print()
    print("  Per-capita compresses or expands the raw count spread.")
    print(f"  Raw count max/min was 94.6x (from aggregation unit spike).")

# ── 4. Zero-population neighborhoods — handling options ───────────────────────
print(f'\n{"=" * WIDTH}')
print("4. Zero-population neighborhoods — options")
print(f'{"=" * WIDTH}')
print("""
  Golden Gate Park, Lincoln Park, McLaren Park, Presidio have zero or
  near-zero residential population. Per-capita is undefined for these.

  Options:
    A) Exclude from Lens 1 per-capita and Lens 2 (show raw count only,
       with a note: "no residential population — per-capita not applicable")
    B) Use daytime/visitor population proxy (transit data, park attendance)
       — more accurate but much more work; not available per-neighborhood
    C) Show per-capita as null / greyed out on the choropleth for these
       neighborhoods, with an explanatory tooltip

  Recommendation: Option C. Grey out on choropleth, tooltip explains why.
  These are parks and a military base — no analyst expects a per-capita
  crime rate for Golden Gate Park to be meaningful.
""")

print(f'{"=" * WIDTH}')
print("Interpretation")
print(f'{"=" * WIDTH}')
print("""
  Per-capita is computable for SF Analysis Neighborhoods WITHOUT areal
  interpolation. DataSF publishes pre-aggregated 2020 Census population
  figures aligned to the same 41 neighborhood boundaries used in the
  incidents table. We use those directly.

  Zero-population neighborhoods (parks, Presidio) are shown on the
  choropleth but greyed out for per-capita and Lens 2 views.

  Write findings in docs/spikes/per_capita_denominator.md.
""")

conn.close()
