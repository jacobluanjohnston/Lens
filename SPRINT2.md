# Sprint 2 Plan — LENS

**Sprint goal (SF only):** As an analyst, I can switch a neighbourhood between raw / per-capita / resolution-adjusted views, so I can see how normalization changes the story.

> No Chicago this sprint. SF only.

---

## Division of work

| Who | What |
|---|---|
| **Jacob** | Everything touching the database, pipeline, and API — spikes first (they determine the schema), then migrations, batch job, and endpoints |
| **Teammate** | Everything in the React app — builds against a mock JSON fixture matching the agreed API shape, wires to real API at the end |

**The only coordination point:** agree on the API response shape (what fields `/lens/2` returns) at the start of the sprint. After that you are completely parallel with zero conflict.

---

## Background: the three lenses

All three lenses read the same underlying incident data. They ask different questions.

- **Lens 1 — Raw count.** How many reported incidents happened here? Contaminated by patrol intensity — heavily-patrolled neighbourhoods generate more reports. Baseline the other lenses are read against.
- **Lens 2 — Officer-initiated enforcement.** Officer-initiated incidents (drug, warrant, prostitution) per 100 victim-reported serious crimes (burglary, robbery, assault, MVT). Shows where enforcement concentrates relative to need. A ratio of 7/100 (Outer Sunset) vs 155/100 (Tenderloin) is a citable finding.
- **Lens 3 — Resolution.** Of the serious crimes that happened here, what share got solved — and is that rate better or worse than the rest of the city for the same crime type? An equity signal: two neighbourhoods with identical crime rates but 60% vs 20% clearance are completely different stories.

---

## Cards — Jacob (data engineering)

### Do these first — they block the DB schema

**SPIKE: Aggregation unit** (3pts)
Should we aggregate by SF Analysis Neighborhoods (41 polygons, already in the incidents table) or a custom grid? Check: what % of incidents already have a neighbourhood value populated, whether grid cells give more even counts, and what the choropleth looks like at each unit. Write `docs/spikes/aggregation_unit.md` and an ADR.
*Acceptance: a documented decision with rationale.*

**SPIKE: Per-capita denominator** (3pts)
Source 2020 Census population data for SF Analysis Neighborhoods. Assess whether areal interpolation is needed (census tracts vs neighbourhood boundaries) or if a pre-aggregated source exists. Write `docs/spikes/per_capita_denominator.md`.
*Acceptance: we know what population number to use for each neighbourhood and how defensible it is.*

---

### After spikes are closed and API shape agreed

**Infra: Geography dimension table** (3pts)
Alembic migration + load SF Analysis Neighborhoods: 41 polygons, name, population from the per-capita spike. Store as PostGIS geometry.
*Acceptance: `SELECT COUNT(*) FROM neighborhoods` = 41; each row has a valid polygon and a population figure.*

**Infra: Precomputed aggregate tables** (3pts)
Alembic migration for a rollup table: one row per (neighborhood × month × category), carrying `incident_count`, `resolved_count`, `population`. This is what all three lens endpoints read from — keeps every request fast without re-aggregating millions of rows on the fly.
*Acceptance: migration runs clean; table exists with the right columns.*

**Infra: Batch aggregation job** (5pts)
Python script (`pipeline/aggregations/sf_rollup.py`) that fills the rollup table from raw incidents. Joins incidents to neighbourhoods via the `neighborhood` field (already populated for 95.07% of rows). Runs after ingest.
*Acceptance: rollup table populated; spot-check a known neighbourhood's monthly count matches a direct `SELECT COUNT(*)` on incidents.*

**API: GET /neighborhoods** (2pts)
Returns GeoJSON FeatureCollection of SF neighborhood polygons. The frontend needs this to draw the map.
*Acceptance: Leaflet renders all 41 polygons correctly.*

**API: GET /lens/1, /lens/2, /lens/3** (3pts)
One endpoint per lens. Returns `{ neighborhood_id, neighborhood_name, value, reference_value }` per neighbourhood for a given `?start=&end=`. Lens 1 = raw count. Lens 2 = officer-initiated per 100 victim crimes. Lens 3 = clearance rate gap vs city median (requires assault surgery below).
*Acceptance: all three return valid JSON; Lens 2 ratio for Tenderloin is visibly higher than Outer Sunset.*

**Assault surgery** (5pts — stretch goal, required before Lens 3 goes live)
Split Aggravated vs Simple Assault using the subcategory field in the incidents table. Flag domestic violence incidents. Purge assault-on-officer rows. Alembic migration to add `assault_type` and `is_dv` columns.
*Acceptance: bucket A incidents no longer include Simple Assault; DV incidents are flagged and excluded from the Lens 3 denominator.*

---

## Cards — Teammate (frontend)

> **Day 1 together:** agree on the `/neighborhoods` and `/lens/*` response shapes with Jacob. Build against a mock fixture matching those shapes — wire to real API at the end.

**Choropleth layer** (5pts)
Replace the existing incident dot layer with a filled polygon layer showing SF neighbourhoods coloured by the active lens value. Uses a mock fixture matching the agreed `/lens/*` shape. Colour scale: sequential for Lens 1 and 3, diverging (above/below city median) for Lens 2.
*Acceptance: map shows 41 coloured polygons; colour updates when the lens changes.*

**Lens toggle** (2pts)
UI control (button group or dropdown) to switch between Lens 1 / Lens 2 / Lens 3. Updates the choropleth colour and the legend label.
*Acceptance: switching updates map colours and legend without page reload.*

**Neighbourhood sidebar** (3pts)
Click a neighbourhood → sidebar panel shows: the three lens values for that neighbourhood side by side, the citywide reference value for comparison, and any flags. Uses mock data.
*Acceptance: clicking any neighbourhood opens the panel with correct mock values.*

**Wire to real API** (2pts)
Swap mock fixtures for real `/neighborhoods` and `/lens/*` calls once backend endpoints are live. 
*Acceptance: map renders real data; no hardcoded values remain.*

**Resolution trend banner** (2pts)
When Lens 3 is active AND the selected date range crosses 2024-08-01, show a banner: *"Your date range crosses a citywide resolution rate shift. Before/after comparisons may reflect a dataset-wide change, not neighbourhood patterns."* Frontend logic only — check query params against the hardcoded breakpoint date.
*Acceptance: banner appears and disappears correctly as the date range changes.*

---

## Point totals

| | Points |
|---|---|
| Jacob | 3+3+3+3+5+2+3 = **22pts** (+ 5pts assault surgery as stretch goal) |
| Teammate | 5+2+3+2+2 = **14pts** |

---

## Sequencing

```
Week 1
  Jacob:    SPIKE aggregation unit → SPIKE per-capita → agree API shape with teammate
  Teammate: Choropleth layer (mock) + Lens toggle

Week 2
  Jacob:    Geography table → Aggregate tables → Batch job → API endpoints
  Teammate: Neighbourhood sidebar (mock) + Resolution trend banner

Week 3
  Jacob:    Assault surgery (stretch) + any backend polish
  Teammate: Wire to real API → done
```

The stretch goal (assault surgery) unlocks Lens 3. If Jacob finishes the core backend early he picks it up and Lens 3 goes live this sprint. If not, Lens 3 shows a placeholder and ships in Sprint 3.
