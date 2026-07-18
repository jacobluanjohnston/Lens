# Lens

A retrospective analysis tool for auditing police enforcement patterns using open public datasets from San Francisco. Built for civic oversight analysts, investigative journalists, and academic researchers.

**The thesis:** police incident records do not capture crime — they capture police contact. A heavily-patrolled neighborhood generates more reports, which makes it look like a hotspot, which has historically justified more patrol. Lens makes that feedback loop visible. It normalizes the same incident data three ways (raw count, per-capita using ACS census population, and officer enforcement ratio) so the same data tells three different stories — and surfaces the differences explicitly rather than hiding them.

**What this looks like in practice:** after Mayor Lurie took office in January 2025, South of Market's officer enforcement ratio rose +79 points compared to the prior period — roughly 4–6× its historical year-over-year baseline. Mission rose +43 points (5× baseline). Tenderloin, by contrast, was lower than its historical average, suggesting a geographic reallocation of enforcement rather than a citywide increase. Lens surfaces this finding in two clicks: select the Lurie preset, read the ranked list.

The same tool applied to the 2026 World Cup shows which neighborhoods are seeing enforcement shift during the event window — a live example of the same analysis applied to a current policy question.

**What's next:** the next version of Lens cross-references enforcement data with auxiliary sources — 311 service requests (unmet civic need), business density (explains raw counts in commercial areas), building violations (housing disinvestment), and public health indicators — to further separate genuine need from patrol intensity. An analyst will walk away with a finding like: "District X has 2.1× the citywide discretionary enforcement rate but 0.7× the victim-reported serious crime rate, and burglaries there resolve in a recorded arrest about half as often as the citywide rate."

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

| Member | Contributions |
|---|---|
| Jacob L. Johnston | Product owner; full-stack scaffold (Docker, CI, FastAPI, PostGIS, Leaflet, Alembic); bulk Socrata ingest pipeline (1M+ SF records); PostGIS point-in-polygon neighborhood assignment; Lens 1 & 2 API endpoints; per-capita denominator spike (ACS B01003 + census tract crosswalk); proactive/reactive classifier spike; G2 & G3 resolution spikes; methodology docs & ADRs; plain-language copy pass |
| Louisa Taufaasau | Scrum master; Next.js migration (Leaflet via dynamic SSR); choropleth map layer; lens toggle; neighborhood drill-down panel with flags; compare mode UI with Before/After pickers and diverging red/blue delta choropleth; controls bar collision avoidance |
| Ishita Jakka | Geography dimension table (41 SF neighborhoods + ACS population); precomputed aggregate table schema & Alembic migration; batch aggregation job producing 78,470 neighborhood × month × category rollup rows that underlie all lens endpoints; neighborhood rankings sidebar |
| Heli Kadakia | Policy event preset dropdown (Lurie & World Cup) with provisional-data warning; Docker Compose deployment with automatic migrations on startup; frontend design; delta legend collision fix |
| Preetam Donepudi | Incident data model (Pydantic schemas + SQLAlchemy ORM); Alembic migrations for raw and normalized incident tables; Socrata API client & SF field mappings; before/after compare API endpoint returning per-neighborhood enforcement ratio delta between two date windows |
