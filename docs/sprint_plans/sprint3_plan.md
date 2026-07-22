# Sprint 3 Plan — LENS

**Product:** LENS
**Team:** LENS
**Sprint completion date:** July 14, 2026
**Revision:** 1.0 — July 2026

---

## Goal

As an analyst, I can open LENS and see SF neighborhoods colored by two different lenses — raw/per-capita incidence and officer enforcement ratio — switch between them, and click any neighborhood to see its metrics. The app runs on real data from a shared environment, not mock fixtures.

---

## Team Roles

| Member | Role |
|---|---|
| Jacob | Tech Lead, Backend Developer, Data Engineer, Scrum Master |
| Louisa | Frontend Developer |
| Ishita | Data Engineer |
| Preetam | Backend Developer |
| Heli | Full-stack Developer |

---

## Scrum Times

- **Monday / Wednesday / Friday** — async standup via Discord
- **Lab section (Wednesday)** — TA check-in
- **Sunday** — integration sync: backend shares DB dump with frontend so Louisa can wire real API

---

## Task Listing by User Story

---

### User Story 1 — Data infrastructure
*As a developer, I want precomputed neighborhood rollup tables so that all lens queries return in under 200ms against 1M+ rows.*

| Task | Estimate |
|---|---|
| Alembic migration: `neighborhoods` table with PostGIS geometry + population | 2 hrs |
| Load 41 SF Analysis Neighborhoods from GeoJSON; verify polygon count | 1 hr |
| Source ACS B01003 population by census tract; join via tract-to-neighborhood crosswalk | 3 hrs |
| Alembic migration: `neighborhood_month_rollup` table | 1 hr |
| `pipeline/aggregations/sf_rollup.py`: populate rollup from raw incidents | 4 hrs |
| Spot-check rollup counts against direct `SELECT COUNT(*)` on incidents | 1 hr |

**Total: ~12 hrs (Ishita)**

---

### User Story 2 — Lens endpoints
*As a developer, I want `/lens/1`, `/lens/2`, and `/lens/3` endpoints so the frontend can fetch per-neighborhood metrics for any date range.*

| Task | Estimate |
|---|---|
| Spike: aggregation unit (neighborhood vs grid) → write `docs/spikes/aggregation_unit.md` | 3 hrs |
| Spike: per-capita denominator (ACS source, interpolation method) → `docs/spikes/per_capita_denominator.md` | 3 hrs |
| Spike: G2 per-category resolution window → `docs/spikes/g2_window_selection.md` | 2 hrs |
| Spike: G3 resolution trend decomposition → `docs/spikes/g3_trend_decomposition.md` | 2 hrs |
| `GET /neighborhoods` — GeoJSON FeatureCollection of 41 polygons | 1 hr |
| `GET /lens/1` — raw count + per-capita per neighborhood | 1 hr |
| `GET /lens/2` — officer enforcement ratio (officer-initiated per 100 victim crimes) | 2 hrs |
| `GET /lens/3` — stub returning 503 (blocked on assault surgery) | 0.5 hr |
| Backend tests: date validation, schema shape, null suppression for parks | 2 hrs |
| Write `docs/methodology.md` and `docs/adr/001_category_bucket_assignments.md` | 2 hrs |

**Total: ~18.5 hrs (Jacob)**

---

### User Story 3 — Choropleth map + lens toggle
*As an analyst, I want the map to color neighborhoods by the active lens so I can visually identify areas with high enforcement relative to crime.*

| Task | Estimate |
|---|---|
| Migrate frontend from React/Vite to Next.js (`frontend-next/`); verify Leaflet works client-side via `dynamic()` | 3 hrs |
| Implement choropleth layer: fetch `/neighborhoods` + `/lens/1`, join on ID, color polygons | 4 hrs |
| Lens toggle panel (Lens 1 / Lens 2): switching re-fetches and recolors map | 2 hrs |
| Lens 3 card: show "coming soon" placeholder until endpoint is ready | 0.5 hr |
| Per-capita / raw count sub-toggle within Lens 1 | 1 hr |

**Total: ~10.5 hrs (Louisa)**

---

### User Story 4 — Neighborhood drill-down panel
*As an analyst, I want to click a neighborhood and see its metrics, flags, and comparison to the city median, so I can investigate a finding without leaving the map.*

| Task | Estimate |
|---|---|
| Neighborhood panel component: renders on map click | 2 hrs |
| Show: lens value, city median, % delta, data flags (geocoding, non-residential, provisional) | 3 hrs |
| Provisional data flag: fires when end date within 90 days of today | 1 hr |
| Wire panel to both Lens 1 and Lens 2 data | 1 hr |

**Total: ~7 hrs (Louisa + Jacob)**

---

## Initial Task Assignment

| Member | First assignment |
|---|---|
| Jacob | Spike: aggregation unit → spike: per-capita denominator |
| Louisa | Next.js migration → choropleth layer (against mock fixture) |
| Ishita | Geography dimension table → rollup migration |
| Preetam | Support Jacob on API contract design |
| Heli | Support Louisa on lens toggle UI |

---

## Initial Burnup Chart

Chart generated at sprint close. See `docs/sprint_reports/sprint3_burnup.png`.
