# Spike: Per-Capita Denominator

**Question:** What population data do we have for SF Analysis Neighborhoods, and is per-capita computable reliably for all 41 neighborhoods?

**Date:** 2026-07-10
**Script:** `pipeline/analysis/per_capita_spike.py`

---

## What we found

**No areal interpolation needed — but not for the reason the spike initially claimed.** The spike originally stated that DataSF pre-aggregates 2020 Census population per neighborhood. This was wrong. DataSF does not publish a population-per-neighborhood table.

**Why areal interpolation is still unnecessary:** The 41 Analysis Neighborhoods are defined by DataSF as aggregations of whole 2010 census tracts — no tract is split between neighborhoods. This means 2020 ACS tract populations can be summed exactly to neighborhood level with no fractional allocation. The tract-to-neighborhood assignment table on DataSF is the join key.

**Correct data pipeline:**
1. Download **"Analysis Neighborhoods - 2020 census tracts assigned to neighborhoods"** from DataSF (search that title). It has a `GEOID` column (the census tract identifier) and a neighborhood name column.
2. Download **ACS table B01003** (Total Population) for SF census tracts from Census Reporter or the Census API.
3. Join on `GEOID`, then sum population by neighborhood.

All 41 neighborhoods matched. The geometry/boundary dataset (`p5b7-5n3h`, "Analysis Neighborhoods") contains polygon geometry only — no population column.

**Four parks/military neighborhoods have per-capita suppressed:** Golden Gate Park, Lincoln Park, McLaren Park, and the Presidio. The ACS data reports non-zero population for all four — the census tracts grouped into these "neighborhoods" include streets and residents adjacent to the park or base. However, per-capita enforcement comparisons are meaningless here because the land use is dominated by non-residential space. Decision: load real ACS values, set `per_capita_applicable = false`, grey out on choropleth with a tooltip for Lens 1 per-capita and Lens 2 views. Do not null the population — that would replace real data with nothing.

**The Farallones:** The tract-to-neighborhood crosswalk contains a 42nd entry ("The Farallones" — uninhabited islands off the SF coast, technically SF County) with no matching polygon in the 41-neighborhood GeoJSON. The load script logs this and drops it. Not a problem — expected data artifact.

**Per-capita meaningfully changes the story:**

| | Raw count spread | Per-capita spread |
|---|---|---|
| Max/min ratio | 94.6x | 18.0x |
| Range | 800–75,681 | 277–4,974 per 1k |

Per-capita compresses the distribution significantly — large residential neighborhoods (Sunset/Parkside: 78k residents) drop dramatically while small high-density commercial areas (Financial District: ~10k residents, 49k incidents) shoot to the top.

**The narrative shift is the point:**

| Neighborhood | Raw rank | Per-capita rank | Per 1k residents |
|---|---|---|---|
| Financial District/South Beach | 4th | 1st | 4,974 |
| Tenderloin | 2nd | 2nd | 3,015 |
| Mission | 1st | 6th | 1,429 |
| Sunset/Parkside | 9th | last (excl. parks) | 277 |

Financial District ranking 1st per-capita makes sense — daytime workers inflate raw counts but don't count as residents. This is exactly the kind of story Lens 1 per-capita exists to surface.

## Therefore

**Per-capita is buildable without areal interpolation.** Because neighborhoods are composed of whole census tracts, tract populations sum exactly. No fractional allocation needed.

**Population source to use:** ACS B01003 at census tract level, joined to neighborhoods via the "Analysis Neighborhoods - 2020 census tracts assigned to neighborhoods" dataset on DataSF. The placeholder values in `pipeline/analysis/per_capita_spike.py` were estimates only — do not use them in production. Pull from ACS.

**Parks/military neighborhoods:** grey out on choropleth for any per-capita view (`per_capita_applicable = false`), with a tooltip. Raw count (Lens 1 raw) still displays normally. Real ACS population values are stored — `per_capita_applicable` handles display suppression.

**API shape implication:** the `/neighborhoods` GeoJSON response should carry `population` and `per_capita_applicable` (false for the 4 parks/Presidio) as properties, so the frontend can handle the grey-out without a separate call.
