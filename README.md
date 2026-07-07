# Lens

A retrospective analysis tool for auditing police enforcement patterns using open public datasets from San Francisco and Chicago. Built for civic oversight analysts.

**The thesis:** at first glance, police incident records appear to capture crime. They capture police contact. Lens makes that visible by cross-referencing enforcement data with auxiliary sources (311 service requests, business density, building violations, census population, and public health indicators) to separate genuine need from patrol intensity. The same incident data, normalized three different ways and set against that broader context, tells three different stories; Lens shows all of them, and surfaces bias and data-quality issues explicitly rather than hiding them.

**Who cares?** An analyst walks away with a specific, citable finding like: "District X has 2.1x the citywide discretionary enforcement rate* but 0.7x the victim-reported serious crime rate*, and burglaries there end in a recorded arrest within 12 months* about half as often as the citywide rate for the same period."

---

## What's been built (Sprint 1)

An interactive map of SF police incidents. Open the app, pick a date range, and see where incidents occurred. Filter by crime type to narrow the view.

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
