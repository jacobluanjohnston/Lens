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
**Points: 5**
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
- At least one of Tenderloin, Mission, or South of Market has `delta` > 50 — the Lurie signal must be visible (South of Market hits ~+79 in real data; Tenderloin is ~+29)
- A neighborhood with no victim crime in either window does not return a 500

---

### CARD 2 — Compare mode UI + delta choropleth (frontend)
**Points: 5**
**Blocked by:** Card 1

#### What it is
A "Compare" toggle in the controls bar. When active: two date range pickers (Before / After), the choropleth switches to a red/blue delta scale, and the neighborhood panel shows both before and after values.

#### Definition of Done
- [ ] "Compare" toggle appears in the controls bar; clicking it shows Before and After month pickers (start + end each), clicking again returns to normal mode
- [ ] Use the existing `MonthPicker` component for all four date inputs — do not build a new date picker
- [ ] In compare mode, fetches `GET /lens/compare` with the four date params on any date change
- [ ] In compare mode, choropleth uses a diverging red/blue scale keyed to `delta`: red = increased enforcement, blue = decreased, grey = null delta — exact hex values in `docs/style-guide.html` (Compare mode section)
- [ ] Scale is symmetric around zero — +50 and −50 are equally saturated
- [ ] Neighborhoods with `delta: null` render grey (`#94a3b8`) and are visually distinct from delta = 0
- [ ] Neighborhood panel in compare mode shows: before ratio, after ratio, delta, and % change
- [ ] Toggling compare off restores normal lens view without re-fetching lens data
- [ ] `CompareData` type defined in `frontend/types/` — no `any` in the compare fetch path
- [ ] No type assertions (`as any`, `as CompareData`) anywhere in the compare fetch handler. Reviewer will grep for `as any` and `as Compare`.
- [ ] Client-side validation: After end ≤ After start does not send a request
- [ ] All new UI elements follow `docs/style-guide.html`: glass panel recipe for any new floating surface, 8px spacing grid, no new font sizes or weights outside the four defined sizes (11/13/18/24px)
- [ ] Delta values displayed in the neighborhood panel use the colors from the style guide: `#b45309` (amber) for increase, `#2563eb` (blue) for decrease

#### Acceptance Criteria
- Analyst clicks Compare, sets Before = Apr 2024–Dec 2024, After = Jan 2025–Sep 2025, map updates showing Tenderloin/Mission/SOMA in red
- Clicking a red neighborhood opens its panel showing both the before and after ratio
- Switching back to normal mode shows the previous lens without a new network request
- Controls bar does not overflow on screens ≤ 640px wide

---

### CARD 3 — Policy event presets
**Points: 3**
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
- [ ] One frontend unit test: render the preset dropdown, select "Mayor Lurie takes office", assert all four date picker values match the exact dates in the table above. No network call needed — this tests state wiring only.

#### Acceptance Criteria
- Analyst selects "Mayor Lurie takes office" → all four pickers fill → map updates with no further interaction
- Analyst selects World Cup → provisional warning appears in the neighborhood panel
- Analyst edits one date after selecting a preset → other three dates are unchanged
- Analyst manually types the same four dates as the Lurie preset (Apr 2024–Dec 2024 / Jan 2025–Sep 2025) without touching the dropdown → map produces the identical choropleth as selecting the preset. The preset is a shortcut, not a special code path.

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
**Points: 1**
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

### CARD 11 — CI: wire frontend tests and fill critical logic gaps
**Points: 5**
**Blocked by:** nothing

#### What it is
The CI pipeline runs lint, migrations, and backend/pipeline tests on every PR but not the frontend Jest suite. This card wires `npm test` into CI and adds tests for the three pieces of logic most likely to draw professor/TA scrutiny: the proactive/reactive category bucketing that underlies all Lens 2 numbers, the per-capita arithmetic, and the compare delta calculation.

#### Definition of Done
- [ ] `ci.yml` runs `npm test` as a required step on every PR

**Frontend tests (add to `frontend/__tests__/`):**
- [ ] `metricFor` returns `raw_count` when `lens1Mode === "raw"` and `per_capita` when `lens1Mode === "per_capita"` — the bug that caused a runtime crash in Card 4 must not regress
- [ ] Provisional flag renders when end date is within 90 days of today and does not render when outside that window

**Backend/pipeline tests (add to `backend/tests/` or `pipeline/tests/`):**
- [ ] Proactive/reactive category bucket assignment: Drug Offense, Warrant, Prostitution, Drug Violation map to officer-initiated; Burglary, Robbery, Assault, Motor Vehicle Theft map to victim-reported — if these buckets are wrong, every Lens 2 number is silently wrong
- [ ] Lens 1 per-capita calculation: given a seeded neighborhood with known population and incident count, the returned `per_capita` value matches the expected arithmetic — tests the math, not just the schema shape
- [ ] Compare delta calculation: given seeded baseline and compare rollup rows with known ratios, the returned `delta` matches `round(compare_ratio - baseline_ratio, 1)`

#### Acceptance Criteria
- `npm test` and `pytest` both exit 0 in CI on a clean branch
- The category bucket test explicitly names every category in both lists — not a spot-check

---

## Stretch cards

---

### CARD 7 — Controls bar: collision avoidance on narrow viewports
**Points: 2**
**Owner:** ltaufaas
**Blocked by:** nothing

#### What it is
On viewports narrow enough that the controls bar and the right-side panel column approach each other, date pickers slide behind the neighborhood panel and become unreachable. The controls bar needs to be aware of how much horizontal space it actually has and reflow so every input stays accessible.

#### Definition of Done
- [ ] Controls bar width is capped so it never overlaps the right panel column at any viewport width ≥ 375px
- [ ] All date pickers (two in normal mode, four in compare mode) are fully visible and clickable when the neighborhood panel is open
- [ ] On viewports ≤ 640px, the controls bar wraps to a second row or otherwise reflows — no input is hidden or unreachable
- [ ] The four compare date pickers do not overflow off-screen on narrow viewports
- [ ] No horizontal scrollbar appears on `<main>` at any tested viewport width
- [ ] Layout at ≥ 1320px is pixel-identical to the current design (see note below)

**Note:** The one-row Compare controls are ~916px wide; the right panel is 360px. They cannot coexist at widths below 1320px without overlapping. 641–1319px uses a wrapped layout; ≥1320px preserves the original single-row desktop layout.

#### Acceptance Criteria
- At 375px viewport width (iPhone SE), all visible date pickers are reachable and tappable without horizontal scrolling
- With a neighborhood panel open on a 768px viewport, no date picker is obscured by the panel
- Switching into compare mode on a narrow viewport (4 pickers visible) does not push any picker off-screen

#### Implementation notes (shipped in `frontend/controls-collision-avoidance`)

Spike: `docs/spikes/mobile_responsive_breakpoints.md`

**How we tested:** manually, in Chrome DevTools device emulation. Every CSS change required a sweep of the full device list. Devices that sit near a breakpoint boundary (iPhone 14 Pro Max at exactly 430px) are where things break — always check those first.

**The breakpoint system we landed on:**

| Breakpoint | Targets | `column top` |
|---|---|---|
| `max-width: 640px` | all phones | 172px |
| `min-width: 430px, max-width: 640px` | wider phones (14 Pro Max+) | 160px |
| `max-width: 640px` + `hover:hover` + `pointer:fine` | narrow desktop browser only | 104px |

The `hover/pointer` media query is the key insight: a phone and a desktop browser at the same pixel width look identical to a plain `min-width` rule. `pointer: fine` only fires for a real mouse — Chrome DevTools phone emulation correctly reports `pointer: coarse`, so it doesn't accidentally apply to emulated devices.

**The panel gap formula:** neighbourhood panels are pushed down with `margin-top: calc(TARGET_VH - (column_top + lens_height + gap))` so a visible map strip sits between the lens picker and the panels. If `column_top` ever changes, the formula must be updated or the gap breaks silently (no error — it just looks wrong).

**The `backdrop-filter` stacking context trap:** the frosted-glass blur on the lens picker creates a stacking context, which scopes any `z-index` inside it to be local. The fix is `z-index: 100` on the `.lens-panel` element itself (not its children) so it wins against the neighbourhood panels in the column's outer stacking context.

**Compare mode is harder:** the controls bar wraps to 4 rows on iPhone SE in compare mode (bar bottom ≈248px vs. 2 rows in normal mode), so the column must start at 280px instead of 172px. Each phone size requires its own `top` value for compare mode — see the methodology doc for the full table.

---

### CARD 8 — Spike: Lurie enforcement shift validation
**Points: 1**
**Owner:** jacobluanjohnston
**Blocked by:** nothing

#### What it is
Confirm the Lurie inauguration finding (SOMA +79, Mission +43, Tenderloin lower) against year-over-year baselines before citing it in documentation or the demo.

#### Definition of Done
- [ ] Spike doc in `docs/spikes/` confirming (or revising) the numbers
- [ ] Year-over-year baseline manually computed and compared to the compare-mode output
- [ ] Finding summarized in STATUS.md

---

### CARD 9 — Fix bottom-left UI collision with delta legend and Leaflet controls
**Points: 1**
**Owner:** hkadakia05
**Blocked by:** nothing

#### What it is
In compare mode, the delta legend (bottom-left) and Leaflet's default zoom/attribution controls overlap. This card resolves the collision so both are visible and neither is obscured.

#### Definition of Done
- [ ] Delta legend and Leaflet controls do not overlap at any supported viewport width
- [ ] Fix does not affect non-compare-mode layout

#### Acceptance Criteria
- In compare mode, the delta legend and zoom controls are both fully visible at 1280px and 1440px viewport widths

---

### CARD 10 — Spike: World Cup validation
**Points: 1**
**Owner:** jacobluanjohnston
**Blocked by:** nothing

#### What it is
Run the same year-over-year enforcement shift check on the World Cup window (May–Jul 2026) once enough data is available. Document result before citing it publicly.

#### Definition of Done
- [ ] Spike doc in `docs/spikes/` confirming which neighborhoods show enforcement shift during the World Cup window
- [ ] Noted whether the finding is strong enough to cite or is still provisional
- [ ] Finding summarized in STATUS.md

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

### STRETCH E — Fix bottom-left UI collision with delta legend and Leaflet controls
**Points: 1**
**Blocked by:** nothing

#### What it is
In compare mode, the delta legend (bottom-left) and Leaflet's default zoom/attribution controls overlap. This card resolves the collision so both are visible and neither is obscured.

#### Definition of Done
- [ ] Delta legend and Leaflet controls do not overlap at any supported viewport width
- [ ] Fix does not affect non-compare-mode layout

#### Acceptance Criteria
- In compare mode, the delta legend and zoom controls are both fully visible at 1280px and 1440px viewport widths

---

### STRETCH F — Spike: mobile responsive breakpoint system
**Points: 2**
**Blocked by:** nothing

#### What it is
A spike writeup that records the non-obvious findings from the controls bar / panel layout work — specifically that pixel-width breakpoints alone can't distinguish a phone from a narrow desktop browser, that `backdrop-filter` silently traps stacking contexts, and the formula that keeps the panel gap correct when column positions change. The goal is that the next person doing responsive layout work starts from the findings, not from scratch.

#### Definition of Done
- [x] `docs/spikes/mobile_responsive_breakpoints.md` exists and covers:
  - The "we learned X, therefore Y" summary up front
  - Why `(hover: hover) and (pointer: fine)` instead of a pixel threshold
  - The three-tier breakpoint table with `column top` values for each zone
  - The panel gap formula and the warning about keeping it in sync with `column top`
  - The `backdrop-filter` stacking context trap and fix
  - The compare mode controls bar row counts per device
  - The device list used for manual testing and why each device was chosen
  - Known remaining rough edges (SE compare mode, landscape)
- [x] `docs/sprint_reports/sprint4.md` STRETCH D implementation notes reference the spike
- [x] No methodology content lives only in conversation history — it is in the file

#### Acceptance Criteria
- A teammate who didn't do this work can read the spike and correctly update a `column top` value without breaking the panel gap
- The `backdrop-filter` stacking context explanation is specific enough that a future engineer recognizes the symptom and knows the fix without re-debugging it

---

## Backlog (not this sprint)

- Compare mode: "Move after end to [month]" fix button — when the After window's end date is within 90 days of today, the provisional warning should include a button that moves the compare end date back to the last stable month (same logic as normal mode's `onFixProvisional`). The warning alone is sufficient for now; this is a UX convenience.
- Chicago adapter — fresh pull, no AI-generated analysis
- Historical ingestion (2003–2018, different schema)
- 311 unmet-need signal
- Repeat location flag
- Incident point cap — pagination or dot-density for multi-year queries
- Side-by-side dual map view
- Lens 1 diverging highlight mode (raw rank vs. per-capita rank difference)
- Resolution trend banner (crosses Aug 2024 marker — decision #12)
