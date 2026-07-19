# Frontend Engineering Log

---

# July 10, 2026

## Decision
The team decided to migrate the LENS frontend from React + Vite to Next.js.

## Reason
Although the existing React + Vite frontend is functional, the team plans to continue developing LENS beyond the course. Next.js provides a stronger long-term foundation through built-in routing, improved project organization, and easier integration of future features as the project grows.

## Migration Strategy
Rather than modifying the existing frontend in place, the migration will be completed in a separate `frontend-next` project. The original Vite frontend will remain available as a working reference until the Next.js implementation reaches feature parity.

## Definition of Done

- [x] `npm run dev` successfully starts the Next.js development server.
- [x] Proxy rewrites forward `/incidents`, `/categories`, and `/health` to the FastAPI backend.
- [x] Leaflet map component is wrapped using `dynamic()` with `ssr: false`.
- [x] Leaflet map loads successfully in the browser.
- [] Existing Sprint 1 functionality has been restored.
  - [ ] Date filter
  - [ ] Crime category filter
  - [ ] Incident markers displayed on the map
- [ ] The Next.js frontend reaches feature parity with the existing Vite frontend.

## Planned Migration

### Files to Replace
- `vite.config.ts`
- `index.html`
- `tsconfig.node.json`

### Files to Migrate
- `App.tsx`
- `index.css`
- `tsconfig.json` (adapted for Next.js)

### Additional Changes
- Replace the Vite proxy with Next.js rewrites.
- Configure Leaflet using browser-only rendering (`dynamic()` with `ssr: false`).

## Expected Outcome
The frontend will preserve Sprint 1 functionality while establishing a scalable architecture for future Sprint 2 features, including Lens visualizations, choropleths, and side panels.

---

# Milestone 1 — Repository Preparation

## Work Completed
- Verified work is being completed on the `feature/frontend-choropleth` branch.
- Reviewed repository status before beginning migration.
- Removed unintended `.DS_Store` files.
- Confirmed the repository was clean before introducing framework changes.

## Reasoning
Verifying repository state before a framework migration reduces the likelihood of committing unrelated changes or working on the wrong branch.

## Outcome
The repository was prepared for migration.

---

# Milestone 2 — Next.js Initialization

## Work Completed
- Created a new `frontend-next` project using the official Next.js project generator.
- Installed project dependencies.
- Started the Next.js development server.
- Verified the application loads successfully.
- Replaced the default Next.js landing page with a temporary LENS homepage.
- Verified hot reloading after source code changes.

## Notes
The project was initialized using the recommended Next.js defaults:

- TypeScript
- App Router
- ESLint
- Tailwind CSS

## Verification

- `npm run dev` starts successfully.
- Browser loads the application.
- Hot reloading functions correctly.

## Outcome
The new frontend foundation was successfully established.

---

# Milestone 3 — Architecture Refactoring

## Work Completed
- Reviewed the Sprint 1 React implementation.
- Planned the migration into reusable modules.
- Created a shared `Incident` type (`types/incident.ts`).
- Created a reusable API utility (`lib/api.ts`).
- Converted `app/page.tsx` into a Client Component.
- Migrated application state using React hooks.
- Restored data-fetching logic using `useEffect`.

## Reasoning
Separating shared types, API communication, and application state establishes a modular architecture that is easier to maintain as additional visualization features are introduced.

## Outcome
The Next.js frontend now follows a modular architecture while preserving the Sprint 1 application logic.

---

# Milestone 4 — Backend Integration

## Work Completed
- Configured Next.js rewrites for:
  - `/incidents`
  - `/categories`
  - `/health`
- Verified requests are successfully forwarded to the FastAPI backend.

## Challenges
Initial requests returned HTTP 500 errors after migration.

Investigation confirmed that:

- Next.js rewrites were functioning correctly.
- FastAPI received the requests.
- PostgreSQL had not yet been populated with the required `incidents` table.

The issue was determined to be backend data initialization rather than a frontend migration problem.

## Outcome
Backend communication has been successfully restored. Remaining API errors are dependent on backend database initialization.

---

# Milestone 5 — Leaflet Migration

## Work Completed
- Installed `leaflet` and `react-leaflet` within the Next.js project.
- Created a dedicated browser-only `ClientMap` component.
- Wrapped the map using Next.js `dynamic()` with `ssr: false`.
- Created a reusable `Map` wrapper component.
- Replaced the temporary landing page with the Leaflet map.
- Successfully rendered OpenStreetMap inside the Next.js application.

## Challenges
Leaflet dependencies were initially installed in the repository root by mistake, creating an unintended Node project.

The accidental root-level `package.json`, `package-lock.json`, and `node_modules` directory were removed before reinstalling the dependencies inside `frontend-next`.

## Verification

- Leaflet renders successfully.
- Browser-only rendering works correctly.
- OpenStreetMap tiles load successfully.
- Map centers correctly on San Francisco.
- The migration requirement to wrap Leaflet with `dynamic()` and `ssr: false` has been satisfied.

## Outcome
The core mapping infrastructure has been successfully migrated to Next.js. Remaining Sprint 1 features (filters and incident markers) can now be restored incrementally as backend data becomes available.

---
July 
# Current Sprint Status

## Completed

- Next.js project initialized.
- Shared frontend architecture established.
- Shared API module created.
- Shared type definitions created.
- Homepage migrated to a Client Component.
- Application state restored.
- Backend rewrites configured.
- Leaflet successfully migrated to Next.js.
- Browser-only map rendering verified.

## Remaining

## Remaining

- Reconnect backend API.
- Re-enable incident fetching.
- Restore category loading.
- Restore incident markers.
- Verify complete Sprint 1 feature parity after backend integration.
---------------
---
# July 12, 2026
# Milestone 6 — Neighborhood Polygon Rendering

## Work Completed

- Downloaded the San Francisco neighborhood GeoJSON dataset.
- Added the dataset to `public/data/`.
- Loaded the GeoJSON using `fetch()` within the ClientMap component.
- Rendered neighborhood polygons using React Leaflet's `GeoJSON` component.
- Applied a temporary uniform styling to all neighborhoods.

## Verification

- GeoJSON loads successfully.
- All 41 San Francisco neighborhoods render on the map.
- Existing dashboard layout and controls remain functional.

## Outcome

The application can now display neighborhood polygons, providing the foundation required for the Sprint 2 choropleth visualization.

---

---

# Milestone 7 — API-First Mock Data Integration

## Decision

The frontend was implemented against the published Sprint 2 API contract instead of using a frontend-specific mock data structure.

## Reason

Using the documented API response format ensures that temporary mock data can be replaced directly with live backend responses once the Sprint 2 endpoints become available. This minimizes integration work and keeps visualization components independent of the data source.

## Work Completed

- Added a `LensData` TypeScript interface matching the published API contract.
- Created a temporary mock API module using the provided mock fixture.
- Preserved the backend response structure without modification.
- Planned to join neighborhood geometry and lens values using the stable `neighborhood_id` key defined by the API contract.
- Created TypeScript models matching the published Sprint 2 API contract.
- Added a temporary mock API module using the documented response structure.
- Deferred creation of React data hooks until backend API integration to avoid unnecessary abstractions while preserving the planned API-first architecture.
- Implemented a lookup structure keyed by `neighborhood_id` to match the published API contract.
- Added helper functions to normalize temporary GeoJSON identifiers to the backend's stable `neighborhood_id` format.

## Future Integration

When the backend endpoints become available:

- Replace the temporary mock API with `fetch()` requests.
- Remove the mock API module.
- Preserve the existing visualization logic without structural changes.

## Outcome

The frontend now follows an API-first architecture that is compatible with the planned backend implementation.

---
---

# Milestone 8 — Choropleth Layer and Lens Toggle

## Work Completed

- Loaded the San Francisco neighborhood GeoJSON into the Next.js frontend.
- Rendered all 41 neighborhood polygons using React Leaflet.
- Created TypeScript models matching the Sprint 2 Lens API contract.
- Added a mock API module using the documented backend response format.
- Joined neighborhood geometry with lens data using the stable `neighborhood_id`.
- Replaced the incident marker visualization with a neighborhood choropleth.
- Added application state for the active lens in `page.tsx`.
- Connected the Lens panel and map through shared React state.
- Implemented a clickable Lens toggle that updates the choropleth without reloading the page.

## Current Mock Implementation

The frontend currently uses the published Sprint 2 mock fixture while backend endpoints are under development.

Current lens mapping:

- Lens 1 → `raw_count`
- Lens 2 → `value`
- Lens 3 → `gap`

This is a temporary implementation that validates frontend behavior. Once the backend is available, these values will be supplied by the `/lens/1`, `/lens/2`, and `/lens/3` endpoints rather than the local mock data.

## Known Limitations

The current mock fixture contains data for only four neighborhoods.

Because each lens visualizes a different metric with a different numeric range, the current implementation uses a simplified shared color scale for validation purposes.

Current observations:

- Lens 1 (`raw_count`) causes all neighborhoods with mock data to appear dark blue because the values are all significantly larger than the current thresholds.
- Lens 2 (`value`) produces the expected distinction between Tenderloin and Outer Richmond.
- Lens 3 (`gap`) uses a sequential color scale even though a diverging scale centered at zero would better represent positive and negative clearance gaps.

These color scales should be revisited once the backend provides complete data for all 41 neighborhoods.

## Verification

- Verified all 41 neighborhood polygons render successfully.
- Verified neighborhood geometry joins correctly with the mock API fixture.
- Verified the choropleth updates immediately when changing lenses.
- Verified lens switching occurs without reloading the page.
- Verified the implementation is structured so the mock data can later be replaced by backend API requests without changing the rendering architecture.

### Milestone 9 – Neighborhood Sidebar (Sprint 2 Goal #45)

**Date:** July 12, 2026

#### Objective

Implement an interactive neighborhood sidebar that displays neighborhood-specific metrics when a user selects a polygon on the choropleth map.

#### Implementation

- Added click handling to neighborhood polygons using React Leaflet's `onEachFeature`.
- Connected selected polygon state to the application using React state (`selectedNeighborhood`).
- Created a reusable `NeighborhoodPanel` component.
- Displays:
  - Neighborhood name
  - All three lens metrics
  - Citywide reference metrics
  - Flag indicators
- Uses Sprint 2 mock API data while backend endpoints are under development.

#### Integration

- The selected neighborhood is managed in `page.tsx`.
- `ClientMap` notifies the parent component when a polygon is selected.
- `NeighborhoodPanel` receives the selected neighborhood as props and renders the associated metrics.

#### Notes

The sidebar intentionally displays **all three lens metrics simultaneously**, independent of the currently selected lens.

The active lens only controls the choropleth color scale, matching the Sprint 2 requirements.

#### Backend Impact

No API changes required.

The implementation follows the documented Sprint 2 API contract and can be switched from mock data to the backend by replacing the mock data source with the production API response.

### Sprint 2 Progress

- ✅ #43 Choropleth Layer
- ✅ #44 Lens Toggle
- ✅ #45 Neighborhood Sidebar
-------------------------

# July 12, 2026 

Frontend Integration Progress

### Completed

- Implemented interactive choropleth map using React Leaflet.
- Added Lens selector supporting:
  - Lens 1 (Incidence)
  - Lens 2 (Officer-Initiated Enforcement)
  - Lens 3 (Resolution)
- Added dynamic choropleth coloring based on the active lens.
- Implemented neighborhood selection by clicking map polygons.
- Added Neighborhood Panel displaying metrics for the selected neighborhood.
- Refactored map components to support future backend integration while maintaining separation between map rendering and lens data.
- Converted neighborhood geometry loading from a local GeoJSON file to a backend endpoint (`GET /neighborhoods`).

### Backend Integration

Attempted integration with the new backend neighborhood endpoint.

Completed:
- Added Next.js rewrite for `/neighborhoods`.
- Replaced local GeoJSON fetch with backend API request.
- Successfully verified frontend communication with the FastAPI backend.

During testing:
- Initial requests failed because the `neighborhoods` database table did not exist locally.
- Applied the latest Alembic migrations successfully.
- Confirmed the `/neighborhoods` endpoint now responds correctly.

Current blocker:
- Endpoint currently returns an empty GeoJSON `FeatureCollection` because the local `neighborhoods` table has not yet been populated.
- Backend team is currently implementing `GET /lens/1`, `GET /lens/2`, and `GET /lens/3`, which will replace the temporary frontend mock lens data.

### Current Frontend State

The application currently uses:

- Backend:
  - `/neighborhoods` (geometry endpoint)
- Mock data:
  - Lens metrics (`mockApi.ts`)

This allows frontend development to continue independently while backend analytical endpoints are completed.

### Next Steps

Once the backend endpoints are available:

- Replace `mockApi.ts` with:
  - `GET /lens/1`
  - `GET /lens/2`
  - `GET /lens/3`
- Join returned lens metrics with neighborhood polygons using `neighborhood_id`.
- Remove remaining frontend mock data.
- Add loading/error handling for asynchronous lens requests.

### UI Polish (Current Focus)

Backend integration is temporarily paused while waiting for the new Lens API endpoints.

Current frontend polish tasks:

- Redesign Lens Panel with modern button-style controls.
- Improve Neighborhood Panel layout using metric cards.
- Add choropleth legend.
- Improve floating sidebar styling.
- Add hover effects and smoother transitions.

---

# July 17, 2026

## Sprint 4 — Card 2: Compare Mode UI and Delta Choropleth (#64)

### Objective

Add a frontend comparison mode for viewing the change in officer-initiated enforcement ratios between two date windows. The implementation is built against the Card 1 `GET /lens/compare` API contract while that endpoint is still under review.

### Work Completed

- Added a Compare toggle to the controls bar.
- Added Before and After month ranges with a start and end picker for each range.
- Added typed compare-mode state without replacing or discarding the normal lens data.
- Added `CompareData` in `frontend/types/compare.ts`.
- Added a typed `GET /lens/compare` request using:
  - `baseline_start`
  - `baseline_end`
  - `compare_start`
  - `compare_end`
- Added runtime response validation using `unknown` and a type guard.
- Added client-side date validation so an invalid comparison window does not send a request.
- Added a symmetric diverging delta choropleth:
  - Red indicates increased enforcement.
  - Blue indicates decreased enforcement.
  - Grey indicates a null or unavailable delta.
  - Zero uses a separate neutral color and is visually distinct from null.
- Added a delta legend using the style guide's glass-small surface recipe.
- Added compare-mode neighborhood details for:
  - Before ratio
  - After ratio
  - Delta
  - Percentage change
- Applied the required delta text colors:
  - Increase: `#b45309`
  - Decrease: `#2563eb`
- Added responsive control wrapping for screens at or below 640px.
- Made lens selection exit Compare mode and immediately restore the selected normal lens.

### Definition of Done Checklist

- [x] Compare toggle appears in the controls bar.
- [x] Compare mode displays Before and After start/end month pickers.
- [x] Toggling Compare off restores the normal controls and lens view.
- [x] Selecting another lens while Compare is active exits Compare mode.
- [x] Date changes request `GET /lens/compare` with all four date parameters.
- [x] Positive deltas render red and negative deltas render blue.
- [x] The delta scale is symmetric around zero.
- [x] Null delta renders grey and differs visually from zero.
- [x] The neighborhood panel shows before ratio, after ratio, delta, and percentage change.
- [x] Normal lens data remains cached when Compare is toggled off.
- [x] Compare data and the compare fetch path contain no `any`.
- [x] The compare fetch handler contains no unsafe or forced type assertions.
- [x] Invalid After windows return before the request is made.
- [x] New UI follows the existing glass, typography, color, and spacing system.
- [x] Controls do not overflow at 640px.
- [x] Verify Tenderloin, Mission, and SOMA colors against the live Card 1 response.
- [x] Verify real before/after neighborhood values after Card 1 is merged locally.

### Verification Completed

- `npx tsc --noEmit` passes.
- The production Next.js build passes.
- Focused ESLint checks pass for the compare API, types, controls, map, and neighborhood panel supporting files.
- `git diff --check` passes.
- Repository searches for the prohibited assertion patterns return no matches.
- Browser-tested the Compare toggle and all four default date pickers at `http://localhost:3000/`.
- Browser-tested invalid After dates and confirmed the client validation message appears.
- Browser-tested toggling back to the normal controls and panel.
- Measured the responsive layout at exactly 640px:
  - Viewport width: 640px
  - Controls width: 604px
  - Page scroll width: 640px
  - No internal controls overflow

### Live Backend Integration

Card 1 was pulled into the frontend branch and the compare UI was tested against the live local endpoint using the acceptance windows.

- `GET /lens/compare` returned all 41 neighborhoods.
- Mission returned `29.4 → 72.0`, delta `+42.6`.
- South of Market returned `55.9 → 135.2`, delta `+79.3`.
- Tenderloin returned `102.9 → 132.3`, delta `+29.4`.
- All three neighborhoods rendered on the red side of the delta scale.
- Clicking South of Market displayed both ratios, delta `+79.3`, and percentage change `+141.9%`.
- Neighborhoods with null deltas rendered grey.
- Neighborhoods with zero deltas rendered with the separate neutral center color.
- Backend request logs confirmed that switching Compare off sent no new lens request.
- Backend request logs confirmed that an invalid After window sent no compare request.
- Browser-tested selecting Officer Enforcement while Compare was active; Compare exited, the normal date controls returned, and Lens 2 became active.

The final backend response includes `baseline_count` in addition to `compare_count`. The frontend type and runtime validator were updated to match this final contract.

### Backend Test Environment Note

The live endpoint works, but the Card 1 test file does not collect in the existing Docker container because the repository-level `/app/__init__.py` shadows the `/app/app` API package. Pytest reports `ModuleNotFoundError: No module named 'app.api'` before running any tests. This is a backend test-environment issue and does not affect the live endpoint or Card 2 browser behavior.

### Existing Project Lint Notes

The full-project ESLint command still reports pre-existing issues in the normal lens fetch path in `app/page.tsx`. These issues were present before Card 2 and are not part of the compare fetch path. All focused checks for the new compare implementation pass.

---

# July 18, 2026

## Sprint 4 — Stretch D: Controls Bar Collision Avoidance

### Objective

Keep every normal and compare date picker visible and reachable when the controls bar approaches the 360px right-panel column. The responsive change must prevent off-screen controls and horizontal page scrolling while preserving the existing wide-desktop layout.

### Baseline Measurements

Browser measurements against the merged controls, preset dropdown, neighborhood panel, and rankings panel confirmed the collision:

| Viewport | Mode | Controls | Right panel | Baseline result |
|---|---|---|---|---|
| 375px | Normal | 18–357px | −5–355px | Overlap |
| 375px | Compare | 18–357px | −5–355px | Overlap |
| 640px | Normal | 18–622px | 260–620px | Overlap |
| 640px | Compare | 18–622px | 260–620px | Overlap |
| 768px | Normal | 18–537px | 388–748px | Overlap |
| 768px | Compare | 18–750px, 875px internal width | 388–748px | Overlap and off-screen controls |
| 1024px | Compare | 18–934px | 644–1004px | Overlap |
| 1200px | Compare | 18–934px | 820–1180px | Overlap |

The policy preset added after the original card was written increased the compare bar's intrinsic width. It does not fit beside the right column until approximately 1314px. Therefore, preserving the existing layout at exactly 1024px conflicts with the higher-priority requirement that controls never overlap. The original single-row layout is preserved from 1320px upward, where it fits without collision.

### Work Completed

- Added responsive classes for the application shell, controls bar, right-panel column, Leaflet controls, and delta legend.
- Preserved the existing absolute desktop positions when the controls and sidebar have enough space.
- Added collision-aware wrapping from 641px through 1319px.
- Capped the controls width to the space left of the 360px right-panel column with a 16px gap.
- Reflowed the right-panel column below the controls at 640px and below.
- Used separate mobile panel offsets for normal and compare modes because compare mode has a taller wrapped controls bar.
- Kept the mobile right column within 18px viewport gutters.
- Moved the delta legend below the Leaflet `+`, `−`, and `SF` controls.
- Used the sentence-case legend label: "Change in police stops vs. crime reports."

### Final Browser Verification

| Viewport | Mode | Controls result | Panel result | Horizontal overflow |
|---|---|---|---|---|
| 375px | Normal | Both pickers visible | Reflowed below controls | None |
| 375px | Compare | All four pickers visible and tappable | Reflowed below controls | None |
| 640px | Normal | Both pickers visible | Reflowed below controls | None |
| 640px | Compare | All four pickers visible | Reflowed below controls | None |
| 768px | Normal | Wrapped left of panel | Panel remains at right | None |
| 768px | Compare | All four pickers wrapped left of panel | Panel remains at right | None |
| 1024px | Compare | Wrapped without collision | Panel remains at right | None |
| 1200px | Compare | Wrapped without collision | Panel remains at right | None |
| 1320px | Compare | Original single-row layout | Panel remains at right | None |
| 1440px | Compare | Original single-row layout | Panel remains at right | None |

At 375px, the Before start picker was opened and changed from April 2024 to January 2024 through the visible month popup, confirming that it was reachable and tappable rather than only visually present.

### Automated Verification

- `npm test -- --runInBand`: passed (1 suite, 1 test).
- `npm run build`: passed after synchronizing the newly merged Jest dependencies.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- Full-project ESLint still reports pre-existing issues in `app/page.tsx` and `NeighborhoodPanel.tsx`; the responsive changes introduced no additional lint findings.

### Files Changed

- `frontend/app/globals.css`
- `frontend/app/page.tsx`
- `frontend/components/Controls.tsx`
- `frontend/components/GlassZoom.tsx`
- `frontend/components/LensPanel.tsx`
- `frontend/docs/frontend-engineering-log.md`

### Mobile Usability Follow-up

- Replaced the permanently expanded lens selector on viewports at or below 640px with a compact, 40px-tall summary showing the active lens.
- The summary is a real button with `aria-expanded` and `aria-controls`; tapping it reveals the complete lens selector.
- Selecting a lens automatically collapses the selector again so the map and neighborhood information regain vertical space.
- Kept the full lens panel unchanged above the mobile breakpoint.
- Added `frontend/components/LensPanel.tsx` to the files changed for this card.
- Kept the map usable on phones by hiding the neighborhood detail and rankings panels behind a `View neighborhoods` control.
- Added a `Return to map` action at the top of the open mobile drawer.
- Made map-polygon and ranking selections open the mobile detail drawer automatically.
- Moved keyboard focus to `Return to map` when the drawer opens and restored it to `View neighborhoods` when the drawer closes.
- Kept Compare mode active when the analyst re-selects the already-active Police Stops lens; Compare now exits only when switching to a different lens.
- Kept validation and API errors outside the collapsed mobile drawer so failures are immediately visible without opening neighborhood details.
- Cleared stale comparison panel and ranking values while a comparison date range is invalid, preventing old metrics from appearing under new invalid date labels.
- Allowed month-picker popovers to extend beyond the responsive controls surface so the calendar is never clipped by the wrapped controls container.
- Raised the controls stacking context only while a month picker is open, keeping the calendar above the lens and neighborhood panels.
- Matched the mobile crime dropdown to the 112px month-picker width so it no longer extends farther across the phone controls bar.
- Moved the Leaflet zoom/reset stack to the lower-right beside the delta legend in mobile Compare mode, keeping all three controls reachable on short 400×597 viewports without shrinking tap targets.
- Kept the neighborhood panels permanently visible at tablet and desktop widths.
