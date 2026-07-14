# Sprint 4 Plan
**Product:** LENS
**Team:** LENS
**Date:** July 2026

---

## Sprint Goal

Wire the full analysis pipeline end-to-end: real flags surfaced in the UI, neighborhood drill-down from real data, policy-change marker for before/after comparison, and the app deployed to a shared environment so the whole team works off one DB.

---

## Planned Cards

| Card | Owner | Pts | Acceptance Criteria | Definition of Done |
|---|---|---|---|---|
| Policy-change marker backend (store marker date, compute before/after metric deltas) |  | 2 | `/policy-marker` endpoint accepts a date and returns before/after lens values for every neighborhood | Endpoint returns delta values; tests pass |
| Policy-change marker frontend (date-picker UI + before/after comparison view) |  | 3 | User can set a marker date; map shows a split or toggle between before/after state | UI renders both states; toggle works |
| Neighborhood drill-down endpoint `GET /neighborhoods/{id}` |  | 3 | Returns three lens values + top incident types + vs. city median for one neighborhood | Endpoint returns correct shape; tests pass |
| Neighborhood drill-down frontend (full panel rendering) |  | 5 | Clicking a neighborhood shows all drill-down data from real API | Panel renders lenses, flags, top categories, city median comparison |
| Performance spike (profile slow queries, evaluate materialized views + indexes) |  | 2 | Slow queries identified; materialized view recommendation documented | `docs/spikes/performance.md` committed |
| Finalize materialized views and aggregate tables |  | 3 | All lens queries return in < 200ms against full dataset | Query times measured and documented |
| Deployment configuration |  | 3 | App runs on a shared hosted environment; all teammates point to same DB | `docker compose up` on server brings up full stack |
| Demo dataset preparation |  | 2 | Small curated dataset loads in < 30s for demo purposes | Seed script committed; loads cleanly on a fresh DB |
| Final testing and bug fixes |  | 3 | All known bugs resolved; full test suite passes | CI green; manual QA checklist signed off |

---

## Stretch Cards (if time allows)

| Card | Owner | Pts | Notes |
|---|---|---|---|
| Gate 4: CA DOJ external validation |  | 2 | Required before Lens 3 can be called externally validated in any published analysis |
| Assault surgery (split Aggravated/Simple Assault, unlocks Lens 3) |  | 5 | Prerequisite for Lens 3; split via subcategory field, flag DV, purge assault-on-officer rows |

---

## Backlog (future sprints)

- Chicago restart — fresh pull, no AI-generated analysis, full adapter from scratch
- Historical ingestion (2003–2018 dataset, different schema, cutover rule)
- 311 unmet-need signal integration
- Repeat location flag
- Resolution trend banner (crosses Aug 2024 marker)
- Incident point cap extension — pagination or server-side dot-density aggregation for multi-year queries
- Neighborhood panel: only render data flags that are active — suppress grayed-out inactive flags entirely so the panel surface only flags that require analyst attention
- Multi-lens neighborhood panel — fetch Lens 1 and Lens 2 in parallel on load; show both sets of metrics when a neighborhood is clicked so the analyst can see the "same data, three stories" comparison without toggling. Map toggle still controls which lens is visualized spatially.
- Lens 1 diverging highlight mode — a third choropleth mode alongside Total / Per Capita that colors neighborhoods by how much their raw-count rank and per-capita rank *differ*. A neighborhood that's dark red on raw but light on per-capita is just dense, not over-policed; one that's high on both tells a different story. This difference is the feedback-loop thesis made visible on a single map.
- Lens 1 side-by-side view — split the map to show Total and Per Capita simultaneously for direct visual comparison. Likely out of scope for a single sprint; evaluate effort vs. the diverging highlight which conveys the same insight more compactly.
