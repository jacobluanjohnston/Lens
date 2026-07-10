# Spike: Geospatial Neighborhood Assignment

**Question:** Do we need to perform point-in-polygon (PIP) to assign incidents to SF's 41 Analysis Neighborhoods, or does the dataset already provide this?

**Date:** 2026-07-05/06

---

## What we found

SF does the work for us. The current dataset (2018–present) includes two pre-assigned geographic fields:

- **`Analysis Neighbourhood`** — the SF Analysis Neighborhood name, assigned by DataSF. Present on 94.51% of rows. This is the field we use directly as the neighborhood dimension.
- **`Police District`** — the SFPD district boundary, a separate geography that does not align with Analysis Neighborhoods. Not used as the primary unit.

Coordinates (`Latitude`, `Longitude`) are also present on 94.54% of rows, but snapped to the nearest intersection rather than the exact address — an intentional privacy protection by SFPD, not an error.

## Null rates

| Field | Null rate | Notes |
|---|---|---|
| `Analysis Neighbourhood` | 5.49% | Incidents outside SF boundaries, geocoding failures, or withheld records |
| `Latitude` / `Longitude` | 5.46% | Similar cause; "Out of SF" records have no coordinates |

The null rates are nearly identical, which suggests they come from the same underlying set of ungeocoded records. These rows are logged and dropped from map views — the per-neighborhood drop rate is surfaced in the UI as a data quality indicator (uneven drop rates across neighborhoods are themselves a signal).

## Therefore

**No point-in-polygon implementation is needed for the current dataset.** We use `Analysis Neighbourhood` directly as the neighborhood dimension for 94.51% of records. The 5.49% of null-neighborhood rows are excluded from neighborhood-level analysis and counted in the coordinate-drop data quality flag.

The PIP fallback (assign neighborhood by spatial join of lat/lon against the neighborhood polygon layer) is implemented as a future option for completeness, but it is not on the critical path — the drop rate is low enough that it does not materially affect any metric.

**For the historical dataset (2003–2017):** the neighborhood column is named differently (`Analysis Neighborhoods 2 2`, a legacy boundary file join artifact) and has higher null rates. Neighborhood assignment for historical data should be re-derived via PIP against the current boundary file when historical ingestion is built (Sprint 2+), rather than trusting the pre-assigned field.
