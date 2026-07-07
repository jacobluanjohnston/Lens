# Lens

A retrospective analysis tool for auditing police enforcement patterns using open public datasets from San Francisco and Chicago. Built for civic oversight analysts.

**The thesis:** at first glance, police incident records appear to capture crime. They capture police contact. Lens makes that visible by cross-referencing enforcement data with auxiliary sources (311 service requests, business density, building violations, census population, and public health indicators) to separate genuine need from patrol intensity. The same incident data, normalized three different ways and set against that broader context, tells three different stories; Lens shows all of them, and surfaces bias and data-quality issues explicitly rather than hiding them.

**Who cares?** An analyst walks away with a specific, citable finding like: "District X has 2.1x the citywide discretionary enforcement rate* but 0.7x the victim-reported serious crime rate*, and burglaries there end in a recorded arrest within 12 months* about half as often as the citywide rate for the same period."

---

## The three lenses
 
**1. Incidence** — where police contact concentrates. Case-level incident counts and density by neighborhood, category, and time.


---

## What's been built (Sprint 1)

### Data model and ingestion pipeline (#9)

We pulled the San Francisco Police Department's public incident report dataset (about 1 million reports, 2018 to present) and loaded it into the database. Two database tables were created:

- **`raw_reports`** — one row for every individual police report filed, exactly as it came from the city, plus a few cleaned-up fields (e.g. typos in category names fixed, resolution status mapped to a consistent set of values)
- **`incidents`** — one row per *case* (a police case can have multiple reports filed against it — an initial report plus follow-up supplements). This table tracks whether a case was eventually resolved, what the final resolution was, where the incident happened, and what kind of crime it was

The ingestion script (`pipeline/adapters/sf/ingest.py`) is what loads the data. You point it at the CSV file and a database URL, and it handles the whole pipeline.

### Filter-by-crime-and-date API endpoint (#14)

Added a `GET /incidents` endpoint to the backend API. It takes a date range (required) and an optional crime category, and returns a list of incidents with their coordinates and timestamps — ready to render as points on a map.

```bash
# All incidents in Q1 2025 (~16k results, returns in under 300ms)
curl "http://localhost:8000/incidents?start=2025-01-01&end=2025-04-01"

# Just burglaries in March 2025
curl "http://localhost:8000/incidents?start=2025-03-01&end=2025-04-01&category=Burglary"
```

The endpoint is capped at 20,000 results so the browser map doesn't choke on large date ranges.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python / FastAPI |
| Database | PostgreSQL + PostGIS |
| Migrations | Alembic |
| Frontend | React + Vite + TypeScript |
| Map | Leaflet / react-leaflet |
| Charts | Recharts |
| Data pipeline | Python / Pandas / GeoPandas |
| Dev environment | Docker Compose |

---

## Getting Started

**Prerequisites:** Docker and Docker Compose.

```bash
docker compose up
```

Optionally, if instead you want to run Python scripts locally outside of Docker, set up a virtual environment first:

```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

Either way, this starts the database (PostgreSQL + PostGIS) and the backend API. The backend will be available at `http://localhost:8000`. Auto-reloads on code changes.

To include the frontend:

```bash
docker compose --profile frontend up
```

The frontend will be available at `http://localhost:5173`. Auto-reloads on code changes.

**Verify everything is working:**

```bash
# PostGIS
docker compose exec db psql -U lens -d lens -c "SELECT PostGIS_Version();"

# FastAPI
curl http://localhost:8000/health

# Alembic
docker compose exec backend alembic upgrade head
```

- **Leaflet** — open `http://localhost:5173`, you should see a map of SF

Optionally, to run the frontend locally without Docker:

```bash
cd frontend
npm install
npm run dev
```

---

## Repo Structure

```
lens/
├── backend/          # FastAPI app
├── pipeline/         # ETL: fetch → normalize → load
├── frontend/         # React + Vite + TS
├── db/               # schema docs, seed data
└── docker-compose.yml
```

---

## Team

| Member            | Role                 | Contribution |
|-------------------|----------------------|---|
| Jacob L. Johnston | Product owner        | — |
| Louisa Taufaasau  | Initial scrum master | — |
| Preetam Donepudi  | —                    | — |
| Ishita Jakka      | —                    | — |
| Heli Kadakia      | —                    | — |
