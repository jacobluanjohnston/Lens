# Lens

A retrospective analysis tool for auditing police enforcement patterns using open public datasets from San Francisco and Chicago. Built for civic oversight analysts.

**The thesis:** at first glance, police incident records appear to capture crime. They capture police contact. Lens makes that visible by cross-referencing enforcement data with auxiliary sources (311 service requests, business density, building violations, census population, and public health indicators) to separate genuine need from patrol intensity. The same incident data, normalized three different ways and set against that broader context, tells three different stories; Lens shows all of them, and surfaces bias and data-quality issues explicitly rather than hiding them.

**Who cares?** An analyst walks away with a specific, citable finding like: "District X has 2.1x the citywide discretionary enforcement rate but 0.7x the victim-reported serious crime rate, and burglaries there end in a recorded arrest within 12 months about half as often as the citywide rate for the same period."

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python / FastAPI |
| Database | PostgreSQL + PostGIS |
| Migrations | Alembic |
| Frontend | Next.js + TypeScript |
| Map | Leaflet / react-leaflet |
| Charts | Recharts |
| Data pipeline | Python / Pandas / GeoPandas |
| Dev environment | Docker Compose |

---

## Getting Started

**Prerequisites:** Docker and Docker Compose.

### Database + API only

```bash
docker compose up db backend
```

The backend API will be available at `http://localhost:8000`. Auto-reloads on code changes.

### Full stack (DB + API + frontend)

```bash
docker compose --profile frontend up
```

The frontend will be available at `http://localhost:3000`.

### Run migrations

Migrations must be run once after the database starts (or after any schema change):

```bash
docker compose exec backend alembic upgrade head
```

### Verify everything is working

```bash
# PostGIS extension
docker compose exec db psql -U lens -d lens -c "SELECT PostGIS_Version();"

# API health
curl http://localhost:8000/health

# Lens 1 data (should return 41 neighborhoods)
curl "http://localhost:8000/lens/1?start=2024-01-01&end=2025-01-01"
```

### Run locally without Docker

```bash
# Backend
pip install -r backend/requirements.txt
DATABASE_URL=postgresql://lens:lens@localhost:5432/lens uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## Running tests

```bash
pytest
```

Tests cover API endpoint behavior, lens calculation logic (including the Lens 2 enforcement ratio), and pipeline transform correctness. No database required for the pure unit tests.

---

## Repo Structure

```
lens/
├── backend/
│   ├── app/
│   │   ├── api/              # route handlers: incidents, lens, neighborhoods
│   │   └── main.py           # FastAPI app entry point
│   ├── alembic/              # migrations — never hand-edit schema
│   │   └── versions/
│   ├── tests/                # API endpoint + lens calculation tests
│   └── requirements.txt
├── pipeline/
│   ├── adapters/
│   │   └── sf/               # SF-specific field mappings and ingest script
│   ├── analysis/             # exploratory scripts used to generate spike findings
│   ├── sources/              # Socrata API client
│   └── tests/                # transform unit tests
├── frontend/            # Next.js frontend (current)
│   └── src/
│       ├── app/              # page.tsx — main layout and data fetching
│       ├── components/       # Map, Controls, LensPanel, NeighborhoodPanel
│       └── types/            # TypeScript types
├── docs/
│   ├── adr/                  # architecture decision records
│   ├── spikes/               # spike findings: what we learned, therefore what we did
│   └── methodology.md        # lens definitions, flag definitions, denominators, limitations
├── demo/
├── docker-compose.yml
└── pytest.ini
```

---

## Team

| Member            | Role                 |
|-------------------|----------------------|
| Jacob L. Johnston | Product owner        |
| Louisa Taufaasau  | Initial scrum master |
| Preetam Donepudi  | —                    |
| Ishita Jakka      | —                    |
| Heli Kadakia      | —                    |
