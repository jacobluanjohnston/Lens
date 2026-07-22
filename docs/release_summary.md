# Release Summary — LENS

**Product:** LENS
**Team:** LENS
**Date:** July 22, 2026

---

## Key User Stories and Acceptance Criteria

---

### US1 — View enforcement patterns on a map
*As a civic oversight analyst, I want to see SF neighborhoods colored by enforcement intensity so I can identify where police activity is concentrated relative to crime.*

**Acceptance criteria:**
- Opening LENS shows a choropleth map of all 41 SF Analysis Neighborhoods
- Neighborhoods are colored by per-capita incident rate (Lens 1) or officer enforcement ratio (Lens 2)
- A lens toggle switches between views without reloading the page
- Clicking any neighborhood opens a panel showing: metric value, city median, % difference, and any data warnings
- The map loads real data for any date range between Jan 2018 and present

---

### US2 — Filter by crime type and date range
*As an analyst, I want to filter the map by crime category and date range so I can isolate the pattern I'm investigating.*

- A date range picker (month granularity) controls the analysis window
- A crime type dropdown filters Lens 1 to a specific category
- Changing either input updates the map without a page reload
- Dates within 90 days of today trigger a provisional data warning

---

### US3 — Compare enforcement before and after a policy event
*As an analyst, I want to select two time windows and see which neighborhoods changed most, so I can identify enforcement shifts linked to a policy event.*

- A "Compare" toggle reveals Before and After date pickers
- The choropleth switches to a diverging red/blue delta scale (red = increased enforcement, blue = decreased, grey = no comparable data)
- Clicking a neighborhood shows: before ratio, after ratio, delta, % change
- A ranked list of all 41 neighborhoods sorted by delta appears in the sidebar
- Selecting the "Mayor Lurie takes office" preset auto-fills Apr 2024–Dec 2024 / Jan 2025–Sep 2025; SOMA and Mission appear in the top movers

---

### US4 — Use a preset policy event
*As an analyst, I want preset events so I don't have to remember or look up the relevant dates.*

- A "Preset events" dropdown in compare mode offers: Mayor Lurie takes office, World Cup SF (2026)
- Selecting a preset fills all four date pickers instantly
- The analyst can manually adjust any date after selecting a preset
- World Cup preset triggers a provisional data warning (data still accumulating)

---

### US5 — Generate a downloadable PDF report
*As an analyst, I want a PDF I can hand to a supervisor or present at a hearing, so my findings are citable without LENS being open.*

- An "Identify Anomaly" button appears in compare mode
- Clicking it opens a modal where the analyst sets a year range (defaults to 2018–2026)
- On confirm, LENS runs the year-over-year comparison for each year in the range, using the same before/after date structure as the selected event
- The PDF includes: anomaly assessment (flagged or within range, with supporting statistics), year-by-year delta table for the tracked neighborhood, right-censoring warning if applicable, methodology note, and data sources
- The PDF downloads directly; it is readable without LENS open
- The tracked neighborhood defaults to the top mover; if the analyst clicked a neighborhood on the map, that one is tracked instead

---

### US6 — Understand data limitations in context
*As an analyst, I want data warnings surfaced alongside findings so I know what caveats to include when I cite a result.*

- Neighborhoods with high geocoding failure rates show a data warning in the panel
- Non-residential neighborhoods (Golden Gate Park, Presidio, etc.) show a note that per-capita figures are not displayed
- Data within 90 days of today is marked provisional
- The PDF includes a methodology note explaining that enforcement records reflect where officers were present, not where crime occurred

---

## Known Problems and Limitations

### Missing functionality
- **Lens 3 (Resolution gap) is disabled.** The endpoint returns 503. The data infrastructure is in place (rollup table, resolution fields, G2/G3 validation done), but assault surgery (splitting aggravated/simple assault) and G4 external validation are not complete. Lens 3 card shows "coming soon."
- **Chicago data is not included.** Prior AI-generated analyses were discarded. Chicago requires a fresh adapter from scratch.
- **Historical SF data (2003–2017) is not ingested.** Only the current dataset (Jan 2018–present) is loaded. The historical schema uses a different field structure and requires a separate adapter.
- **311, business license density, and transit ridership data are not included.** These contextual signals are in the product backlog.

### Edge cases not handled
- **Cross-year events in Identify Anomaly are blocked.** If the Before and After windows span different calendar years at the month level, the "Identify Anomaly" button is disabled with a tooltip. The year-over-year pattern comparison would produce overlapping pairs.
- **World Cup data is provisional.** July 2026 incident reports are still being filed. The World Cup comparison should be treated as preliminary.
- **Incident point cap at 100k rows.** The raw incident dot view caps at 100k. Multi-year all-category queries will hit this limit and return a truncated result. The choropleth lenses are not affected (they read from the precomputed rollup).

### Design shortcuts
- **`MAX_REPORT_YEAR` is hardcoded to 2026** in `generateReport.ts`. When new annual data is ingested, this constant must be bumped manually.
- **Anomaly threshold is mean + 2SD** of the tracked neighborhood's own historical deltas. This is a statistical heuristic — it flags unusual values relative to prior years but does not account for citywide trends or confounding factors.
- **Areal interpolation is area-weighted**, not dasymetric. Parks and water bodies are assigned population proportional to area, which overstates population in low-density tracts. This affects per-capita figures for neighborhoods with large parks (Golden Gate Park, Presidio).

### Known bugs
- None blocking at release. See sprint report for cards deprioritized to backlog (delta legend / zoom controls overlap in compare mode on narrow viewports — Card 9).

---

## Product Backlog

Priority order for a follow-on project:

1. **Lens 3 — Resolution gap** — Assault surgery (split aggravated/simple, flag DV, purge assault-on-officer) + G4 external validation against CA DOJ OpenJustice + frontend Lens 3 card
2. **Historical SF data (2003–2017)** — Separate ingest adapter for the historical schema; Jan–May 2018 overlap cutover rule already designed
3. **Chicago adapter** — Fresh pull from Chicago Data Portal; per-city adapter already architected; community area geography already partially spiked
4. **311 service requests** — Unmet-need / civic disinvestment signal; foil to enforcement data; already identified as a DataSF Socrata source
5. **Business license density** — Separates busy commercial districts from residential areas; explains raw count concentrations
6. **Resolve delta legend / zoom controls overlap** — Compare mode bottom-left collision (Card 9); cosmetic but visible in demo
7. **Raise or paginate the 100k incident point cap** — Server-side dot-density aggregation for multi-year queries
8. **Custom bucket picker** — Let analyst override which categories count as officer-initiated vs. victim-reported (Stretch B)
9. **World Cup spike validation** — Once July 2026 data stabilizes, run the same year-over-year validation as the Lurie spike
10. **G4 external validation** — Compare LENS clearance rates against CA DOJ OpenJustice; required before Lens 3 findings can be cited publicly
