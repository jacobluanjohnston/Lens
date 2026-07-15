# Sprint 4 — Final Sprint

**Product:** LENS
**Date:** July 2026
**Spike backing the policy comparison feature:** `docs/spikes/three_era_enforcement_analysis.md`

---

## Sprint Goal

An analyst can select a policy event (Mayor Lurie's inauguration, World Cup ramp-up), see which neighborhoods' enforcement behavior changed most before vs. after, and read a ranked list of biggest movers — without knowing any dates or doing any math. The app is deployed to a shared environment. Language is plain enough for a non-technical audience.

---

## Already shipped (do not re-do)

- Neighborhood drill-down panel — real data, flags, city median, % delta
- Lens 1 and Lens 2 endpoints and choropleth
- Precomputed rollup table (78,470 rows, all queries < 200ms)
- Custom month picker, fit-to-SF, scroll sensitivity
- Inter font, type scale, logo, favicon

---

## Must-do cards

---

### CARD 1 — Compare endpoint (backend)
**Points: 3**
**Blocked by:** nothing

#### What it is
New API endpoint that accepts two date windows and returns the per-neighborhood change in officer enforcement ratio between them.

#### Definition of Done
- [ ] `GET /lens/compare` exists in `backend/app/api/`
- [ ] Accepts: `baseline_start`, `baseline_end`, `compare_start`, `compare_end` (all `YYYY-MM` — month granularity, same as `/lens/1` and `/lens/2`)
- [ ] Returns JSON array, one object per neighborhood: `neighborhood_id`, `neighborhood_name`, `baseline_ratio`, `compare_ratio`, `delta` (rounded to 1 decimal), `baseline_count`, `compare_count`
- [ ] Returns 422 with readable `detail` if any date param is missing, or either window end ≤ start, or either window < 30 days
- [ ] Neighborhoods with zero victim-reported crimes in either window return `delta: null` — never divide by zero
- [ ] Reads from `neighborhood_month_rollup`, not raw incidents
- [ ] `backend/tests/test_compare_api.py` with at least 3 tests: valid request returns 41 rows; missing param returns 422; zero-victim neighborhood returns null delta without crashing
- [ ] Tests use a real test database with seeded `neighborhood_month_rollup` rows — no mocking the DB connection or patching psycopg2. A test that patches the DB will be rejected in review.
- [ ] No test hardcodes an expected delta value — deltas must be computed from seeded data

#### Acceptance Criteria
- `curl "http://localhost:8000/lens/compare?baseline_start=2024-04&baseline_end=2024-12&compare_start=2025-01&compare_end=2025-09"` returns 41 objects
- Tenderloin's `delta` in that call is positive and greater than 50 — the Lurie signal must be visible
- A neighborhood with no victim crime in either window does not return a 500

---

### CARD 2 — Compare mode UI + delta choropleth (frontend)
**Points: 5**
**Blocked by:** Card 1

#### What it is
A "Compare" toggle in the controls bar. When active: two date range pickers (Before / After), the choropleth switches to a red/blue delta scale, and the neighborhood panel shows both before and after values.

#### Definition of Done
- [ ] "Compare" toggle appears in the controls bar; clicking it shows Before and After month pickers (start + end each), clicking again returns to normal mode
- [ ] In compare mode, fetches `GET /lens/compare` with the four date params on any date change
- [ ] In compare mode, choropleth uses a diverging red/blue scale keyed to `delta`: red = increased enforcement, blue = decreased, grey = null delta
- [ ] Scale is symmetric around zero — +50 and −50 are equally saturated
- [ ] Neighborhoods with `delta: null` render grey and are visually distinct from delta = 0
- [ ] Neighborhood panel in compare mode shows: before ratio, after ratio, delta, and % change
- [ ] Toggling compare off restores normal lens view without re-fetching lens data
- [ ] `CompareData` type defined in `frontend/types/` — no `any` in the compare fetch path
- [ ] No type assertions (`as any`, `as CompareData`) anywhere in the compare fetch handler. Reviewer will grep for `as any` and `as Compare`.
- [ ] Client-side validation: After end ≤ After start does not send a request

#### Acceptance Criteria
- Analyst clicks Compare, sets Before = Apr 2024–Dec 2024, After = Jan 2025–Sep 2025, map updates showing Tenderloin/Mission/SOMA in red
- Clicking a red neighborhood opens its panel showing both the before and after ratio
- Switching back to normal mode shows the previous lens without a new network request
- Controls bar does not overflow on screens ≤ 640px wide

---

### CARD 3 — Policy event presets
**Points: 2**
**Blocked by:** Card 2

#### What it is
A dropdown of preset events that auto-fills the Before/After date ranges. Two presets. APEC is explicitly excluded — see spike doc for why.

| Label | Before | After |
|---|---|---|
| Mayor Lurie takes office | Apr 2024–Dec 2024 | Jan 2025–Sep 2025 |
| World Cup SF (2026) | Jan 2026–Apr 2026 | May 2026–Jul 2026 |

#### Definition of Done
- [ ] "Preset events" dropdown appears only when Compare mode is active
- [ ] Selecting a preset auto-fills all four date pickers
- [ ] After selecting a preset, analyst can still manually edit any of the four dates
- [ ] World Cup preset triggers the existing provisional data warning (end date within 90 days of today)
- [ ] APEC / Xi Jinping is NOT in the dropdown — no exceptions
- [ ] Preset labels use plain language — no internal variable names or date strings visible in the label

#### Acceptance Criteria
- Analyst selects "Mayor Lurie takes office" → all four pickers fill → map updates with no further interaction
- Analyst selects World Cup → provisional warning appears in the neighborhood panel
- Analyst edits one date after selecting a preset → other three dates are unchanged

---

### CARD 4 — Neighborhood rankings sidebar
**Points: 3**
**Blocked by:** nothing

#### What it is
A ranked list of all 41 neighborhoods below the neighborhood detail panel. In normal mode: sorted by the active lens metric. In compare mode: sorted by delta. Replaces the "Analysis Flags" placeholder panel that currently shows static text.

#### Definition of Done
- [ ] Ranked list renders below the neighborhood detail panel in the right sidebar
- [ ] In normal Lens 1 mode: sorted by per-capita rate, highest first
- [ ] List re-sorts live when the active lens changes — no page refresh required
- [ ] In normal Lens 2 mode: sorted by enforcement ratio, highest first
- [ ] In compare mode: sorted by `delta`, largest positive change first
- [ ] Each row: rank number, neighborhood name, metric value
- [ ] Clicking a row sets the selected neighborhood (same as clicking the map polygon)
- [ ] Selected neighborhood is visually highlighted in the list
- [ ] List is independently scrollable — does not push the detail panel off screen
- [ ] FlagsPanel component is removed or replaced — the placeholder text "Run an analysis..." must not appear anywhere

#### Acceptance Criteria
- In the Lurie compare preset, Tenderloin, Mission, and South of Market appear in the top 5
- Clicking a neighborhood in the list highlights it on the map and opens its panel
- The list does not jump to top when selected neighborhood changes

---

### CARD 5 — Language simplification
**Points: 2**
**Blocked by:** nothing

#### What it is
Copy-only pass. No logic changes. Every string in the table below must change exactly as written. Search for each "old" string after the PR — zero results required.

| File | Old | New |
|---|---|---|
| `LensPanel.tsx` | `"Officer Enforcement"` | `"Police Stops vs. Crime Reports"` |
| `LensPanel.tsx` | `"Proactive stops per 100 victim-reported crimes"` | `"How much police-initiated activity vs. crimes reported by residents"` |
| `NeighborhoodPanel.tsx` | `"Lens 2 — Officer Enforcement"` | `"Police Stops vs. Crime Reports"` |
| `NeighborhoodPanel.tsx` | `"Enforcement Ratio"` (metric label) | `"Police Stops per Crime Report"` |
| `NeighborhoodPanel.tsx` | `"High geocoding failure rate"` | `"Some incidents couldn't be placed on the map"` |
| `NeighborhoodPanel.tsx` | `"No resident population"` | `"No residents — per-person figures not shown"` |
| `NeighborhoodPanel.tsx` | `"Data flags"` | `"Data warnings"` |
| `NeighborhoodPanel.tsx` | Lens 2 description appears above metric cards | Move it to below the metric value, above the city median line |

#### Acceptance Criteria
- `grep -r "officer-initiated\|victim-reported\|proactive" frontend/` returns zero results
- The phrases "officer-initiated", "victim-reported", and "proactive" do not appear anywhere visible in the UI
- A non-technical person shown the neighborhood panel can explain "Police Stops per Crime Report" without being told what it means
- The lens 2 explanation text appears after the number, not before it

---

### CARD 6 — Deployment
**Points: 3**
**Blocked by:** nothing

#### What it is
The app runs on a shared environment all teammates can access with one URL. No more "works on my machine."

#### Definition of Done
- [ ] `docker compose up` on the server starts db, backend, and frontend
- [ ] Migrations run automatically on backend startup (add to entrypoint or compose healthcheck chain)
- [ ] Frontend at a reachable URL (even a local IP on the team network is acceptable for a course project)
- [ ] Backend health check passes: `curl <url>/health` returns 200
- [ ] Lens 1 data check passes: `curl "<url>/lens/1?start=2024-01-01&end=2025-01-01"` returns 41 neighborhoods
- [ ] README deployment section updated with the actual URL and any credentials needed

#### Acceptance Criteria
- Any teammate can open the URL in a browser and see real SF data without running anything locally
- A teammate who has never run the project locally can use the deployed app

---

## Stretch cards (do only if must-do cards are merged with ≥ 2 days left)

---

### STRETCH A — Resolution Gap: assault surgery
**Points: 8 total — three sub-tasks, do in order**

Sub-task A (3pts): Add `assault_type` column via Alembic migration. Populate from `subcategory` field: aggravated, simple, dv_flagged, on_officer, unknown. Log counts for each bucket. `aggravated + simple + dv_flagged + on_officer + unknown` must equal total assault rows — no silent drops.

Sub-task B (3pts): `GET /lens/3?start=&end=` endpoint. Clearance rate gap for Burglary, Robbery, Aggravated Assault only, Motor Vehicle Theft. Uses per-category N-day windows from G2 spike. Returns `clearance_rate`, `city_median_rate`, `gap` per neighborhood. DV-flagged assaults included but disclosed. Minimum 3 tests.

Sub-task C (2pts): Lens 3 frontend card. Remove "coming soon" placeholder. Neighborhood panel shows clearance rate, gap, % delta. Choropleth colors by gap. DV note surfaced as a data warning. Lens 3 card stays disabled until Sub-task B is merged.

**Do not start Sub-task B until Sub-task A is verified. Do not start Sub-task C until Sub-task B is merged.**

---

### STRETCH B — Custom bucket picker for officer enforcement
**Points: 3**
**Blocked by:** nothing

#### What it is
Right now the officer enforcement calculation hardcodes which categories count as "police-initiated" (Drug Offense, Drug Violation, Warrant, Prostitution) and which count as "victim-reported" (Burglary, Robbery, Assault, Motor Vehicle Theft). This card lets the analyst override those defaults by checking/unchecking categories — so they can test "what if I include Traffic Violation Arrest?" or "what if I remove Warrant?".

#### Definition of Done
- [ ] A category picker UI appears in the neighborhood panel or controls bar when Lens 2 / compare mode is active — not always visible, only on demand (e.g. an "Edit buckets" expand toggle)
- [ ] Two lists shown: "Police-initiated" and "Victim-reported", each with checkboxes per category
- [ ] Defaults match the current hardcoded buckets exactly — toggling nothing and fetching returns identical results to the current behavior
- [ ] Selected buckets are passed to the API as query params: `officer_cats=Drug+Offense,Warrant&victim_cats=Burglary,Robbery,Assault,Motor+Vehicle+Theft`
- [ ] Backend `GET /lens/2` and `GET /lens/compare` both accept optional `officer_cats` and `victim_cats` params; if absent, use the hardcoded defaults
- [ ] A "Reset to defaults" button restores the original bucket lists
- [ ] No category can appear in both lists simultaneously — moving one to a list removes it from the other
- [ ] Custom bucket state does not persist across page refresh (session only)

#### Acceptance Criteria
- Analyst unchecks "Warrant" from police-initiated → map recolors without a page refresh
- Analyst adds "Traffic Violation Arrest" to police-initiated → ratio increases in high-traffic areas
- Analyst clicks "Reset to defaults" → buckets return to original and map recolors
- Two categories cannot be checked in both lists at the same time

---

### STRETCH C — G4: CA DOJ external validation
**Points: 2**
**Blocked by:** Stretch A Sub-task B

Before any Lens 3 clearance rate can be called externally validated, compare it against CA DOJ OpenJustice data. Document result in `docs/spikes/g4_external_validation.md`. If numbers are in the right order of magnitude and rank order is consistent, Lens 3 is cleared for use. If not, document why and what it means for interpretation.

---

## Backlog (not this sprint)

- Chicago adapter — fresh pull, no AI-generated analysis
- Historical ingestion (2003–2018, different schema)
- 311 unmet-need signal
- Repeat location flag
- Incident point cap — pagination or dot-density for multi-year queries
- Side-by-side dual map view
- Lens 1 diverging highlight mode (raw rank vs. per-capita rank difference)
- Resolution trend banner (crosses Aug 2024 marker — decision #12)
