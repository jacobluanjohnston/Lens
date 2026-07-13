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

