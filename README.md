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

### Full stack (DB + API + frontend)

```bash
docker compose up
```

The frontend will be available at `http://localhost:3000`. The backend API will be available at `http://localhost:8000`. Migrations run automatically on backend startup — no manual step required.

### Database + API only

```bash
docker compose up db backend
```

### Verify everything is working

```bash
# API health
curl http://localhost:8000/health

# Lens 1 data (should return 41 neighborhoods)
curl "http://localhost:8000/lens/1?start=2024-01-01&end=2025-01-01"

# PostGIS extension
docker compose exec db psql -U lens -d lens -c "SELECT PostGIS_Version();"
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
# Backend + pipeline
pytest

# Frontend
cd frontend && npm test
```

---

## Repo structure

```
lens/
├── backend/
│   ├── app/
│   │   ├── api/              # route handlers: lens, compare, neighborhoods
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
├── frontend/
│   ├── app/                  # page.tsx — main layout and data fetching
│   ├── components/           # Map, Controls, LensPanel, NeighborhoodPanel, RankingsPanel
│   ├── lib/                  # API helpers, preset events
│   └── types/                # TypeScript types
├── docs/
│   ├── adr/                  # architecture decision records
│   ├── spikes/               # spike findings: what we learned, therefore what we did
│   └── methodology.md        # lens definitions, flag definitions, denominators, limitations
├── docker-compose.yml
└── pytest.ini
```

---

## Deployment

The app runs on a shared instance — any teammate can access real SF data without cloning the repo or running anything locally.

**URL:** https://parky-efren-nondynastically.ngrok-free.app

**Credentials:** none required to view the app. The database uses local dev credentials (`lens` / `lens`) and is never exposed outside the host machine.

### How it works

`docker compose up` on the host machine starts the database, backend, and frontend in the correct order, verified by health checks.

Migrations run automatically. The backend startup command chains `alembic upgrade head && uvicorn` — every time the container starts, any pending migrations are applied before the server accepts traffic.

The frontend runs a production build (`next build` + `next start`) rather than the dev server, avoiding the HMR/hydration issues that come with sharing a `next dev` instance.

The URL is served via ngrok rather than a bare local IP. A local IP only works on the same network, and campus eduroam blocks device-to-device traffic via client isolation. ngrok exposes the instance over a public HTTPS URL that works from anywhere.

---

## Team

| Member | Role |
|---|---|
| Jacob L. Johnston | Product owner |
| Louisa Taufaasau | Scrum master |
| Preetam Donepudi | Engineer |
| Ishita Jakka | Engineer |
| Heli Kadakia | Engineer |
