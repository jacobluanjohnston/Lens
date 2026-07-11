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
