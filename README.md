# Lens

A retrospective analysis tool for auditing police enforcement patterns using open public datasets from San Francisco and Chicago. Built for civic oversight analysts.

**The thesis:** at first glance, police incident records appear to capture crime. They capture police contact. Lens makes that visible by cross-referencing enforcement data with auxiliary sources (311 service requests, business density, building violations, census population, and public health indicators) to separate genuine need from patrol intensity. The same incident data, normalized three different ways and set against that broader context, tells three different stories; Lens shows all of them, and surfaces bias and data-quality issues explicitly rather than hiding them.

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
# Coming soon — one-command bring-up
docker compose up
```

The stack will include a PostGIS-enabled Postgres instance, a FastAPI backend, and a React frontend. Full setup instructions will live in `docs/setup.md` once the Docker Compose file is written.

_PostGIS is a spatial extension for PostgreSQL that adds geometry types and fast geographic queries. We will assign each incident to its containing neighborhood polygon across 10M+ rows._

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