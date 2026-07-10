# Spike: Aggregation Unit — Neighborhoods vs Grid

**Question:** Should Lens 2 and Lens 3 aggregate by SF Analysis Neighborhoods (41 polygons, pre-assigned by DataSF) or a custom grid?

**Date:** 2026-07-10
**Script:** `pipeline/analysis/aggregation_unit_spike.py`

---

## What we found

**Coverage:** 95.07% of incidents already have `neighborhood` populated — pre-assigned by DataSF using the same 41 Analysis Neighborhood polygons used in their own published dashboards. No point-in-polygon implementation needed for the current dataset.

**Volume distribution across 41 neighborhoods:**

| Percentile | Incidents |
|---|---|
| Min | 800 (Presidio) |
| p10 | 2,625 |
| Median | 12,458 |
| p90 | 41,325 |
| Max | 75,681 (Mission) |
| Max/min ratio | 94.6x |

The distribution is skewed — Mission (10.67%) and Tenderloin (9.69%) together hold ~20% of all incidents. But this reflects real geography and enforcement patterns, not an artifact of the aggregation choice. A grid would create similarly uneven cells and lose the civic meaning of neighborhood boundaries.

**Small neighborhoods — volume floor concern:**

Seven neighborhoods fall below 500 incidents/year:

| Neighborhood | Total | Per year |
|---|---|---|
| Presidio | 800 | 94 |
| McLaren Park | 907 | 107 |
| Seacliff | 1,087 | 128 |
| Lincoln Park | 1,283 | 151 |
| Treasure Island | 2,625 | 309 |
| Twin Peaks | 4,011 | 472 |
| Glen Park | 4,222 | 497 |

**Bucket A volume (Burglary, Robbery, Assault, MVT):**

| | Count |
|---|---|
| Min | 56 |
| p25 | 1,766 |
| Median | 2,641 |
| Max | 18,308 |

The minimum of 56 bucket A incidents (across ~8.5 years) means the smallest neighborhoods have fewer than 10 serious crimes per year — far too sparse for reliable per-category clearance rates in Lens 3.

## Therefore

**Use SF Analysis Neighborhoods.** A grid would require building a population denominator from scratch (no pre-existing Census-to-grid mapping), has no pre-assigned values in the incidents table, and would lose the civic meaning of neighborhood boundaries that analysts and journalists actually use.

**Volume floor required for flags and Lens 3.** The choropleth can color all 41 neighborhoods. But flags (enforcement concentration, resolution gap) must not fire on neighborhoods below a minimum volume threshold — a clearance rate based on 5 burglaries is not a finding. Recommended floor: suppress per-category Lens 3 flags for neighborhoods with fewer than 50 bucket A incidents in the analysis period. Show the value on the map but mark it as low-confidence.

The seven small neighborhoods (Presidio, McLaren Park, Seacliff, Lincoln Park, Treasure Island, Twin Peaks, Glen Park) should carry a low-confidence indicator on all Lens 3 views. Lens 1 and Lens 2 ratios are less sensitive to small counts and can display normally.
