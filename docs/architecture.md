# LENS — Architecture Overview

> For team members and presenters. This document explains what every piece of the system does, how it connects to the next piece, and how to draw the architecture diagram for a presentation.

---

## The one-sentence version

Raw SF crime data → cleaned and loaded into a spatial database → served by an API → rendered as an interactive map in the browser.

---

## The full journey, step by step

### 1. External data sources
Three datasets come in from the outside world:

- **SF crime incidents** — downloaded from DataSF (Socrata). 2018–present. Each row is one reported incident with a date, category, resolution, and GPS coordinate.
- **Census population** — from the US Census ACS. Gives us the number of residents per census tract so we can compute per-capita figures.
- **Neighborhood boundaries** — 41 SF analysis neighborhoods as polygon shapefiles. Defines where each neighborhood begins and ends on the map.

None of these are in the same format or the same geographic unit. Connecting them is the hard part.

---

### 2. Ingestion pipeline (`pipeline/`)

**Language:** Python (Pandas + GeoPandas)

**What it does:** fetch → normalize → load

- **Fetch:** pulls data from Socrata's API or bulk CSV export.
- **Normalize:** four concrete things happen to SF's raw data:
  1. **Column renaming** — SF's CSV uses verbose headers (`"Incident Category"`, `"Analysis Neighborhood"`) that get renamed to clean internal names (`category_raw`, `neighborhood`) for consistency, future-proofing against future datasets, and human-readability.
  2. **Typo fixes** — SF's own export contains confirmed typos (`"Weapons Offence"` → `"Weapons Offense"`, `"Motor Vehicle Theft?"` → `"Motor Vehicle Theft"`). These are hardcoded fixes discovered by inspecting the data.
  3. **Resolution standardization** — SF stores resolutions as plain English strings (`"Cite or Arrest Adult"`, `"Cite or Arrest Juvenile"`, `"Exceptional Adult"`). These get collapsed into a unified enum (`arrest_cite`, `exceptional`, `open`, `unfounded`) so the API can reason about them consistently. This was built for Lens 3 which is on hold in the product backlog.
  4. **Deduplication** — SF files multiple rows per incident (initial report + supplement updates). SQL window functions collapse these into one row per incident, keeping the earliest report for category/location and the *latest* resolution so we know if a case was eventually closed after the initial filing.
- **Spatial join:** each incident has a lat/lng coordinate. GeoPandas checks which neighborhood polygon contains that point (point-in-polygon). This is how we know "this incident happened in SOMA."
- **Aggregate:** instead of storing 2.5M individual rows for every map view, we precompute rollup tables — incident counts per neighborhood per month per crime type. Map views read from these small summary tables (thousands of rows) instead of the raw table (millions of rows). This is why the map loads fast.
- **Load:** writes the cleaned, joined, aggregated data into PostgreSQL.

> **Why not do this in the browser or the API?** Joining 2.5M incidents to neighborhood polygons on every page load would take seconds. We do it once, offline, and cache the result in the database.

---

### 3. Database (`PostgreSQL + PostGIS`)

**Why PostgreSQL?** It handles millions of rows, enforces data integrity, and supports multiple users at once.

**Why PostGIS?** PostGIS is a PostgreSQL extension that understands geometry — polygons, points, distances. It lets us write queries like "find all incidents inside this neighborhood polygon" using spatial indexes instead of checking every row.

**Table families:**
- `raw_incidents` — every normalized incident (2.5M rows)
- `neighborhoods` — the 41 polygon boundaries + name + population
- `aggregate_*` — precomputed rollups: count / arrests / resolutions per neighborhood × month × crime type
- `audit_flags` — precomputed flags per neighborhood (low confidence, provisional data, etc.)

---

### 4. Backend API (`backend/`, FastAPI)

**Language:** Python (FastAPI)

**What it does:** sits between the database and the browser. The frontend never talks directly to the database — it asks the API for data, and the API queries the database and formats the response.

**Key endpoints:**
- `/lens/1` — returns incident counts (raw + per-capita) per neighborhood for a date range → used by Lens 1
- `/lens/2` — returns police-stop-to-crime-report ratio per neighborhood → used by Lens 2
- `/compare` — returns before/after deltas per neighborhood → used by compare mode
- `/neighborhoods` — returns neighborhood polygons as GeoJSON → used to draw the map

**Why FastAPI?** It's async (handles multiple requests at once), typed (catches bugs early), and auto-generates API documentation.

---

### 5. Frontend (`frontend/`, Next.js + TypeScript)

**What it does:** everything the user sees and touches.

- **Leaflet map** — renders the neighborhood polygons, colors them by the active lens value (choropleth), handles clicks.
- **Controls bar** — date range pickers, lens toggle, Before/After button, preset events dropdown.
- **Neighborhood panel** — drill-down detail for the clicked neighborhood: metric value, city median comparison, data flags.
- **Lens system** — switching lenses doesn't reload the page; it asks the API for a different metric and recolors the map.

**Why Next.js?** React framework with server-side rendering. The Leaflet map component loads client-side only (maps need the browser's window object).

---

## How to draw the architecture diagram

Draw five boxes left to right, connected by arrows:

```
[External Sources] → [Pipeline] → [PostgreSQL + PostGIS] → [FastAPI] → [Next.js Frontend]
```

Label each arrow with what travels across it:

- Sources → Pipeline: `CSV / Socrata API`
- Pipeline → Database: `normalized rows + aggregates`
- Database → FastAPI: `SQL queries`
- FastAPI → Frontend: `GeoJSON + metrics (JSON)`

Below the database box, add a sixth box pointing up into the database:

```
[Batch flag job] → PostgreSQL
```

Label it: `runs on each ingest, writes audit_flags table`

### Colors to use (optional)
- External sources: grey
- Pipeline: blue (data engineering)
- Database: dark blue (storage)
- API: green (backend)
- Frontend: purple (UI)
- Batch job: orange (background process)

---

## Why each layer exists (the one-liner version)

| Layer | Why it exists |
|---|---|
| Pipeline | Raw data from different cities is inconsistent — needs a cleaning step before it's usable |
| PostGIS | Connecting a lat/lng point to a neighborhood polygon requires geometry math at scale |
| Precomputed aggregates | 2.5M rows → fast map loads. Aggregate once offline, read cheap per request |
| FastAPI | Keeps database credentials off the browser; shapes data for the frontend |
| Next.js | Makes the map interactive and the lenses switchable without page reloads |
| Batch flag job | Flag computation is expensive — run it once after each ingest, not on every request |

---

## What's not in the diagram (and why)

- **Chicago adapter** — the pipeline is designed for it (one adapter per city), but SF was the proof-of-concept city.
- **311 / socioeconomic datasets** — planned; each requires its own adapter + bias documentation before it can be responsibly included.
- **Lens 3 (Resolution Gap)** — the pipeline and database support it, but the computation requires careful crime-category surgery (drug offenses self-clear at ~100% by definition, which would make over-policed areas look well-served — the opposite of the truth).
