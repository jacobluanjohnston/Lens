# Test Plan and Report — LENS

**Product:** LENS
**Team:** LENS
**Date:** July 22, 2026

---

## System Test Scenarios

Each scenario maps to a user story. Pass/fail reflects the released system version on `main` as of July 22, 2026.

---

### Scenario 1 — View enforcement choropleth (US1) — PASS

**User story:** As an analyst, I want to see SF neighborhoods colored by enforcement intensity.

1. Open LENS at `http://localhost:3000` (or deployed URL)
2. Verify all 41 SF Analysis Neighborhoods appear as colored polygons on the map
3. Verify the default lens is Lens 1 (per-capita incidence)
4. In the Lens panel, switch to Lens 2 (Police Stops vs. Crime Reports)
5. Verify the map recolors using a diverging scale; Tenderloin should appear notably darker than Outer Sunset
6. Click the Tenderloin neighborhood
7. Verify a panel opens showing: enforcement ratio value, city median, % difference

**Expected:** Map loads with 41 polygons; lens switch updates colors without page reload; panel shows correct metrics.
**Result:** PASS

---

### Scenario 2 — Date range and crime type filter (US2) — PASS

**User story:** As an analyst, I want to filter by crime category and date range.

1. In the controls bar, change the start month to Jan 2024 and end month to Dec 2024
2. Verify the map updates to reflect 2024 data
3. Open the crime type dropdown; select "Burglary"
4. Verify the map and any incident dot view update to show only Burglary incidents
5. Change the end date to a month within 90 days of today
6. Click a neighborhood; verify the panel shows a provisional data warning

**Expected:** Date and category filters update the map; provisional warning fires for recent end dates.
**Result:** PASS

---

### Scenario 3 — Before/After compare mode (US3) — PASS

**User story:** As an analyst, I want to compare two time windows to see enforcement shifts.

1. In Lens 2, click the "Compare" button
2. Verify four date pickers appear (Before start/end, After start/end)
3. Set Before = Apr 2024–Dec 2024, After = Jan 2025–Sep 2025
4. Verify the choropleth switches to a diverging red/blue delta scale
5. Verify SOMA (South of Market) appears in red (increased enforcement)
6. Click SOMA; verify the panel shows before ratio, after ratio, delta, and % change
7. Verify the rankings sidebar shows SOMA in the top 3 movers
8. Click "Exit Compare"; verify the map returns to the previous lens view

**Expected:** Compare mode shows diverging choropleth; SOMA delta ~+79; rankings sorted by delta.
**Result:** PASS

---

### Scenario 4 — Policy event presets (US4) — PASS

**User story:** As an analyst, I want preset events so I don't have to enter dates manually.

1. Enter compare mode
2. Open the "Preset events" dropdown
3. Select "Mayor Lurie takes office"
4. Verify all four date pickers fill: Before = Apr 2024–Dec 2024, After = Jan 2025–Sep 2025
5. Verify the map updates immediately without further interaction
6. Select "World Cup SF (2026)"
7. Verify date pickers update to the World Cup window
8. Click a neighborhood; verify a provisional data warning appears in the panel

**Expected:** Presets auto-fill dates; map updates; World Cup triggers provisional warning.
**Result:** PASS

---

### Scenario 5 — Generate PDF report / Identify Anomaly (US5) — PASS

**User story:** As an analyst, I want a downloadable PDF I can share.

1. Select the "Mayor Lurie takes office" preset in compare mode
2. Click the "Identify Anomaly" button
3. Verify a modal opens with start year (2018) and end year (2026) defaults
4. Click "Confirm"
5. Verify a progress indicator appears above the button while the report runs
6. Verify a PDF downloads automatically when complete
7. Open the PDF; verify it contains:
   - An anomaly assessment ("anomalous" or "within range") with supporting statistics
   - A year-by-year delta table covering 2018–2026
   - The tracked neighborhood name
   - A methodology note and data sources section
8. Click a specific neighborhood (e.g. SOMA) on the map, then run Identify Anomaly again
9. Verify the PDF tracks SOMA instead of the default top mover

**Expected:** PDF downloads; contains anomaly assessment, year-by-year table, tracked neighborhood, methodology.
**Result:** PASS

---

### Scenario 6 — Cross-year event validation (US5 edge case) — PASS

**User story:** As an analyst, I want the tool to warn me if my date range would produce invalid comparisons.

1. Enter compare mode
2. Set Before start = Jan 2025, Before end = Jun 2025
3. Set After start = Jan 2026, After end = Jul 2026
   *(After end bleeds one year past After start — a cross-year event)*
4. Hover over the grayed-out "Identify Anomaly" button
5. Verify a tooltip appears: "Each period must stay within one calendar year."
6. Verify the button cannot be clicked

**Expected:** Button disabled with tooltip when date range crosses a calendar year boundary.
**Result:** PASS

---

### Scenario 7 — Data warnings visible (US6) — PASS

**User story:** As an analyst, I want data limitations surfaced alongside findings.

1. Click Golden Gate Park on the map
2. Verify the panel shows a note that per-capita figures are not displayed (non-residential area)
3. Set the end date to within 90 days of today
4. Verify a "provisional data" warning appears in the neighborhood panel
5. In Identify Anomaly, set end year to 2026
6. Verify the PDF includes a right-censoring data flag section

**Expected:** Non-residential note, provisional warning, and right-censoring flag all render correctly.
**Result:** PASS

---

### Scenario 8 — Lens 3 disabled (known limitation) — PASS (expected behavior)

1. In the Lens panel, attempt to select Lens 3
2. Verify the card appears but is disabled / shows "coming soon"
3. Verify no network request is made to `/lens/3`

**Expected:** Lens 3 is unavailable; the UI communicates this clearly rather than crashing.
**Result:** PASS

---

## Unit Tests

Automated tests are in the release branch. All tests pass as of July 22, 2026.

### Backend / pipeline (`backend/tests/`, `pipeline/tests/`)

Run with: `pytest backend/ pipeline/ --tb=short`

| Test file | What it covers |
|---|---|
| `backend/tests/test_incidents_api.py` | Date range validation (422 on reversed range), valid range returns list, schema check, category filter, `/categories` endpoint |
| `backend/tests/test_compare_api.py` | `/lens/compare` returns 41 rows, missing param returns 422, null delta for zero-victim neighborhood |
| `backend/tests/test_lens_calculations.py` | Category bucket assignment (Drug Offense/Warrant/Prostitution → officer; Burglary/Robbery/Assault/MVT → victim); Lens 1 per-capita arithmetic against seeded data |
| `pipeline/tests/test_sf_transforms.py` | `_norm_category`: dirty value normalization (11 cases); `_norm_resolution`: resolution enum mapping |

**All tests pass.** CI runs these on every PR via GitHub Actions.

### Frontend (`frontend/__tests__/`)

Run with: `npm test -- --ci` from `frontend/`

| Test file | What it covers |
|---|---|
| `frontend/__tests__/LensLogic.test.tsx` | `metricFor` returns correct field for Lens 1 raw/per-capita; provisional flag renders when end date within 90 days; does not render when outside window |
| `frontend/__tests__/PresetDropdown.test.tsx` | Preset dropdown renders; selecting "Mayor Lurie takes office" fills correct dates |

**All tests pass.**
