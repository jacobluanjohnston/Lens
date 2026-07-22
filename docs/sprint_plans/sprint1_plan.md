# Sprint 1 Plan — LENS

**Product:** LENS
**Team:** LENS
**Sprint completion date:** July 7, 2026
**Revision:** 1.0 — July 7, 2026

---

## Goal

Scaffold a working development environment and understand the SF crime dataset well enough to build on it confidently. By the end of this sprint, the project has a runnable stack and a documented data model — so Sprint 2 can build data infrastructure without re-investigating the source data.

---

## Team Roles

| Member | Role |
|---|---|
| Jacob | Tech Lead, Backend Developer, Data Engineer, Scrum Master |
| Louisa | Frontend Developer (onboarding; active from Sprint 2) |
| Ishita | Data Engineer (onboarding; active from Sprint 2) |
| Preetam | Backend Developer (onboarding; active from Sprint 2) |
| Heli | Full-stack Developer (onboarding; active from Sprint 2) |

*Sprint 1 is a solo scaffold sprint executed by Jacob while teammates onboard. All team members contribute from Sprint 2.*

---

## Scrum Times

- **Monday / Wednesday / Friday** — async standup via team Discord (written update: what I did, what's next, any blockers)
- **Lab section (Wednesday)** — TA check-in during scheduled lab time

---

## Task Listing by User Story

---

### User Story 1 — Project scaffold
*As a developer, I want a one-command development environment so that all team members can run the same stack without manual setup.*

| Task | Estimate |
|---|---|
| Create monorepo structure (`backend/`, `pipeline/`, `frontend/`, `docs/`) | 1 hr |
| Write `docker-compose.yml` with PostGIS, FastAPI, and Next.js services | 2 hrs |
| Scaffold FastAPI app with health check endpoint and Alembic migrations | 2 hrs |
| Scaffold Next.js + TypeScript frontend with Leaflet map rendering SF | 3 hrs |
| Wire GitHub Actions CI: lint (ruff), run migrations, run pytest | 2 hrs |
| Set branch protection: require PR + CI pass before merge to main | 0.5 hr |

**Total: ~10.5 hrs**

---

### User Story 2 — Data profiling
*As a data engineer, I want to understand the SF crime dataset's schema, data quality, and field semantics before building a data model, so that I don't have to re-engineer ingestion after discovering surprises.*

| Task | Estimate |
|---|---|
| Pull SF crime CSV (current dataset) from DataSF and profile schema | 1 hr |
| Pull SF crime CSV (historical dataset, 2003–2017) and diff against current schema | 1 hr |
| Run data quality audit: null rates, coordinate coverage, dirty category values | 2 hrs |
| Measure report lag distribution; check for null-island and future timestamps | 1 hr |
| Investigate proactive vs. reactive classifier spike (CAD number / Filed Online) | 3 hrs |
| Document findings in `docs/spikes/` | 1 hr |

**Total: ~9 hrs**

---

### User Story 3 — Raw map view
*As an analyst, I want to see real SF crime incidents on a map filtered by date range, so that I can confirm data is loading correctly before building any lens logic.*

| Task | Estimate |
|---|---|
| Alembic migration: `raw_reports` + `incidents` tables | 2 hrs |
| `pipeline/adapters/sf/ingest.py`: read CSV → normalize categories → load `raw_reports` | 4 hrs |
| Derive `incidents` table via `INSERT…SELECT` grouped by Incident Number | 2 hrs |
| `GET /incidents?start=&end=&category=` endpoint, cap 100k rows | 1 hr |
| Wire frontend date inputs → fetch `/incidents` → render dots on Leaflet map | 2 hrs |
| `GET /categories` endpoint; populate crime type dropdown | 1 hr |

**Total: ~12 hrs**

---

## Initial Task Assignment

| Member | First assignment |
|---|---|
| Jacob | Docker Compose scaffold → data profiling → ingest.py |

---

## Initial Burnup Chart

Chart generated at sprint close. See `docs/sprint_reports/sprint1_burnup.png`.

*Sprint 1 was planned and executed by one contributor; the burnup was linear.*
