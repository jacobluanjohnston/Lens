import geopandas as gpd
import psycopg2
import os

import csv
import sys
import json

csv.field_size_limit(sys.maxsize)
DB_URL = os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens")

# Load population from the ACS B01003 (CensusReporter) + the DataSF tract crosswalk
GEOJSON_PATH = "data/sf/sf_neighborhoods.geojson"
CROSSWALK_PATH = "data/sf/analysis_neighborhoods_tracts.csv"   # tract GEOID -> neighborhood
ACS_POP_PATH = "data/sf/acs_b01003_tracts.csv"                 # tract GEOID -> B01003001

# Per-capita is undefined here (parks + military base)
ZERO_POP = {"Golden Gate Park", "Lincoln Park", "McLaren Park", "Presidio"}
# <500 incidents/yr -> too sparse for reliable Lens 3 rates
LOW_CONFIDENCE = {
    "Presidio", "McLaren Park", "Seacliff", "Lincoln Park",
    "Treasure Island", "Twin Peaks", "Glen Park",
}

# False = store real ACS values + set per_capita_applicable=false (recommended, honest).
# True  = null out population for the 4 (matches the card's literal wording).
NULL_ZERO_POP = False

def slugify(name: str) -> str:
    return name.lower().replace("/", "-").replace(" ", "-")

# Join on neighborhood name to get population per row
def build_population_lookup() -> dict:
    """Sum whole-tract ACS population by neighborhood via the DataSF crosswalk.
    No areal interpolation: each tract maps to exactly one neighborhood
    (analysis neighborhoods are whole-tract aggregates).
    """
    # tract GEOID -> population (strip the "14000US" summary-level prefix)
    tract_pop = {}
    with open(ACS_POP_PATH) as f:
        for r in csv.DictReader(f):
            geoid = r["geoid"].split("US")[-1]
            tract_pop[geoid] = int(r["B01003001"])
    # tract GEOID -> neighborhood
    tract_to_nhood = {}
    with open(CROSSWALK_PATH) as f:
        for r in csv.DictReader(f):
            tract_to_nhood[r["geoid"]] = r["neighborhoods_analysis_boundaries"]
    lookup, unmatched = {}, []
    for geoid, nhood in tract_to_nhood.items():
        if geoid not in tract_pop:
            unmatched.append(geoid)          # log, never silently drop
            continue
        lookup[nhood] = lookup.get(nhood, 0) + tract_pop[geoid]
    if unmatched:
        print(f"[warn] {len(unmatched)} crosswalk tracts had no ACS population: {unmatched}")
    return lookup


def main() -> None:
    gdf = gpd.read_file(GEOJSON_PATH).to_crs(epsg=4326)
    population_lookup = build_population_lookup()
    # Log neighborhoods in the crosswalk but absent from the geojson
    # (e.g. "The Farallones", pop 0) so the drop is explicit, not silent.
    crosswalk_only = set(population_lookup) - set(gdf["nhood"])
    if crosswalk_only:
        print(f"[info] crosswalk neighborhoods not in geojson (dropped): {crosswalk_only}")
    loaded, skipped = 0, []
    conn = psycopg2.connect(DB_URL)
    try:
        with conn.cursor() as cur:
            for _, row in gdf.iterrows():
                name = row["nhood"]
                if name not in population_lookup and name not in ZERO_POP:
                    skipped.append(name)     # no population + not a known park -> log
                    continue
                pop = population_lookup.get(name)
                if NULL_ZERO_POP and name in ZERO_POP:
                    pop = None
                cur.execute(
                    """
                    INSERT INTO neighborhoods
                        (neighborhood_id, neighborhood_name, population,
                         per_capita_applicable, low_confidence, geom)
                    VALUES (%s, %s, %s, %s, %s, ST_Multi(ST_GeomFromGeoJSON(%s)))
                    ON CONFLICT (neighborhood_id) DO NOTHING
                    """,
                    (
                        slugify(name),
                        name,
                        pop,
                        name not in ZERO_POP,
                        name in LOW_CONFIDENCE,
                        json.dumps(row.geometry.__geo_interface__),   # string, not dict
                    ),
                )
                loaded += 1
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
    print(f"loaded {loaded} neighborhoods; skipped {len(skipped)}: {skipped}")
if __name__ == "__main__":
    main()