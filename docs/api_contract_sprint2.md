# LENS API Contract — Sprint 2

> This document defines the shape of the API endpoints the frontend builds against.
> The backend implements these; the frontend mocks against this shape from day 1.
> Do not change field names without telling both sides.

---

## Confirmed from spikes before writing this

- **41 SF Analysis Neighborhoods** confirmed in DB (aggregation unit spike, 2026-07-10)
- **95.07% of incidents** have `neighborhood` pre-populated — no point-in-polygon needed
- **4 zero-population neighborhoods** (Golden Gate Park, Lincoln Park, McLaren Park, Presidio) — per-capita undefined, show greyed out
- **7 low-confidence neighborhoods** (Presidio, McLaren Park, Seacliff, Lincoln Park, Treasure Island, Twin Peaks, Glen Park) — too sparse for reliable Lens 3 flags
- **No areal interpolation needed** — DataSF pre-aggregates population per neighborhood (per-capita spike, 2026-07-10). Exact population figures need to be verified against DataSF before loading into the DB — the spike used estimates.

---

## Endpoints

### GET /neighborhoods

Returns the 41 SF Analysis Neighborhood polygons as GeoJSON. The frontend uses this to draw the base choropleth layer. Load once on startup.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[...], ...]]
      },
      "properties": {
        "neighborhood_id": "tenderloin",
        "neighborhood_name": "Tenderloin",
        "population": 22786,
        "per_capita_applicable": true,
        "low_confidence": false
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [[[...], ...]] },
      "properties": {
        "neighborhood_id": "golden-gate-park",
        "neighborhood_name": "Golden Gate Park",
        "population": null,
        "per_capita_applicable": false,
        "low_confidence": false
      }
    }
  ]
}
```

**Field notes:**
- `neighborhood_id` — URL-safe slug (lowercase, hyphens). Stable key for joining lens responses.
- `population` — 2020 Census population. `null` for parks/Presidio.
- `per_capita_applicable` — `false` for Golden Gate Park, Lincoln Park, McLaren Park, Presidio. Frontend greys these out on per-capita and Lens 2 views with tooltip: *"No residential population — per-capita not applicable."*
- `low_confidence` — `true` for the 7 sparse neighborhoods. Frontend shows value on choropleth but suppresses flag annotations and adds a tooltip: *"Low incident volume — rates may be unreliable."*

---

### GET /lens/1

Raw count and per-capita for each neighborhood. Returns both in one response — the frontend toggles between them using the lens toggle without a second round trip.

**Query params:**
- `start` — YYYY-MM-DD (inclusive)
- `end` — YYYY-MM-DD (inclusive)
- `category` — optional, e.g. `Burglary`. Omit for all categories.

```json
[
  {
    "neighborhood_id": "tenderloin",
    "neighborhood_name": "Tenderloin",
    "raw_count": 8234,
    "per_capita": 361.4,
    "reference_raw": 1847,
    "reference_per_capita": 617.6,
    "low_confidence": false,
    "per_capita_applicable": true
  },
  {
    "neighborhood_id": "golden-gate-park",
    "neighborhood_name": "Golden Gate Park",
    "raw_count": 1203,
    "per_capita": null,
    "reference_raw": 1847,
    "reference_per_capita": 617.6,
    "low_confidence": false,
    "per_capita_applicable": false
  }
]
```

**Field notes:**
- `raw_count` — incident count in the selected period.
- `per_capita` — incidents per 1,000 residents. `null` if `per_capita_applicable` is false.
- `reference_raw` / `reference_per_capita` — citywide **median** (not mean — robust to outlier neighborhoods). Used by the frontend to position the colour scale midpoint and show "above/below city median" in the sidebar.
- Frontend colour scale: for raw mode use `raw_count` and `reference_raw`; for per-capita mode use `per_capita` and `reference_per_capita`.

---

### GET /lens/2

Officer-initiated incidents per 100 victim-reported serious crimes, per neighborhood.

**Query params:**
- `start` — YYYY-MM-DD (inclusive)
- `end` — YYYY-MM-DD (inclusive)

```json
[
  {
    "neighborhood_id": "tenderloin",
    "neighborhood_name": "Tenderloin",
    "value": 155.3,
    "reference_value": 36.0,
    "low_confidence": false,
    "per_capita_applicable": true
  }
]
```

**Field notes:**
- `value` — officer-initiated incidents (Drug, Warrant, Prostitution, Traffic Violation Arrest, Weapons Carrying) per 100 victim-reported serious crimes (Burglary + Robbery + Assault + MVT) in the selected period.
- `reference_value` — citywide median ratio.
- `per_capita_applicable` — `false` for parks/Presidio (no meaningful denominator for either numerator or denominator).
- Colour scale: diverging. Midpoint = `reference_value`. Higher = more officer-initiated enforcement relative to victim crime.
- Sidebar copy template: *"Officer-initiated enforcement here is [X] per 100 victim-reported crimes, compared to a city median of [reference_value]. Anomalous relative to [period]."* Never: *"this neighbourhood is over-policed."*

---

### GET /lens/3

Clearance rate gap per neighborhood — how far above or below the city rate for the same crime type. **Gated on assault surgery** — returns a 503 with `{"detail": "Lens 3 not yet available — assault surgery pending"}` until that work is complete.

**Query params:**
- `start` — YYYY-MM-DD (inclusive)
- `end` — YYYY-MM-DD (inclusive)
- `category` — required. One of: `Burglary`, `Robbery`, `Assault`, `Motor Vehicle Theft`.

```json
[
  {
    "neighborhood_id": "bayview-hunters-point",
    "neighborhood_name": "Bayview Hunters Point",
    "clearance_rate": 4.2,
    "reference_rate": 8.1,
    "gap": -3.9,
    "low_confidence": false,
    "provisional": false
  }
]
```

**Field notes:**
- `clearance_rate` — % of bucket A incidents in this neighborhood resolved within N days (per-category N from G2: MVT 30d, Assault 150d, Burglary 180d, Robbery 190d).
- `reference_rate` — citywide clearance rate for the same crime type and period.
- `gap` — `clearance_rate - reference_rate`. Negative = under-served relative to city.
- `provisional` — `true` if the selected period includes the trailing 60–90 days (incomplete supplements). Frontend shows a banner: *"Recent data is incomplete — resolution rates for the last 60–90 days may be understated."*
- Resolution trend banner: if `start` < `2024-08-01` and `end` >= `2024-08-01`, frontend shows: *"Your date range crosses a citywide resolution rate shift (+9.1pp since August 2024). Before/after comparisons may reflect a dataset-wide change, not neighbourhood-specific patterns."*
- Colour scale: diverging. Midpoint = 0 (city rate). Red = below city rate (under-served). Green = above.
- Sidebar copy template: *"[Category] clearance here is [gap]pp [below/above] the city rate for [period]. Anomalous relative to citywide [category] clearance."*

---

## Mock fixture for frontend

She can use this as her mock JSON while the backend is being built. Replace with real API calls once endpoints are live.

```json
[
  { "neighborhood_id": "tenderloin", "neighborhood_name": "Tenderloin", "raw_count": 8234, "per_capita": 361.4, "reference_raw": 1847, "reference_per_capita": 617.6, "low_confidence": false, "per_capita_applicable": true, "value": 155.3, "reference_value": 36.0, "clearance_rate": 6.1, "reference_rate": 8.1, "gap": -2.0, "provisional": false },
  { "neighborhood_id": "outer-richmond", "neighborhood_name": "Outer Richmond", "raw_count": 1802, "per_capita": 39.5, "reference_raw": 1847, "reference_per_capita": 617.6, "low_confidence": false, "per_capita_applicable": true, "value": 7.2, "reference_value": 36.0, "clearance_rate": 10.3, "reference_rate": 8.1, "gap": 2.2, "provisional": false },
  { "neighborhood_id": "golden-gate-park", "neighborhood_name": "Golden Gate Park", "raw_count": 1203, "per_capita": null, "reference_raw": 1847, "reference_per_capita": 617.6, "low_confidence": false, "per_capita_applicable": false, "value": null, "reference_value": 36.0, "clearance_rate": null, "reference_rate": 8.1, "gap": null, "provisional": false },
  { "neighborhood_id": "presidio", "neighborhood_name": "Presidio", "raw_count": 94, "per_capita": null, "reference_raw": 1847, "reference_per_capita": 617.6, "low_confidence": true, "per_capita_applicable": false, "value": null, "reference_value": 36.0, "clearance_rate": null, "reference_rate": 8.1, "gap": null, "provisional": false }
]
```

---

## What the frontend needs to build

From this shape they can build:
- **Choropleth layer** — colour by `raw_count` or `per_capita` (Lens 1), `value` (Lens 2), `gap` (Lens 3)
- **Lens toggle** — switches which field drives the colour scale
- **Grey-out logic** — `per_capita_applicable: false` → grey polygon, tooltip
- **Low-confidence indicator** — `low_confidence: true` → hatching or reduced opacity, tooltip
- **Neighbourhood sidebar** — all three lens values side by side on click
- **Resolution trend banner** — date range check against `2024-08-01` (frontend only)
- **Provisional banner** — `provisional: true` on any Lens 3 row

---

## Notes for backend

- `neighborhood_id` slugs must be consistent between `/neighborhoods` and all `/lens/*` responses — the frontend joins on this key.
- `reference_raw` and `reference_per_capita` are citywide **medians**, computed server-side and returned with every response. Do not return the mean.
- Population figures in `per_capita_spike.py` are estimates used for the spike only. Verify exact figures against DataSF before loading into the geography dimension table.
- Clean up the `"Ocean View/Merced/Ingleside"` duplicate key in `per_capita_spike.py` — the DB spelling is `"Oceanview/Merced/Ingleside"` (no space).
- Lens 3 returns 503 until assault surgery is complete. Wire the frontend to handle this gracefully (show a "coming soon" state, not an error).
