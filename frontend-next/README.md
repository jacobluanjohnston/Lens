# LENS Frontend (Next.js)

This directory contains the **Next.js frontend** for **LENS**, a retrospective public safety analytics platform for exploring police enforcement patterns through multiple analytical lenses.

This frontend replaces the original React + Vite implementation as part of the Sprint 2 migration.

---

## Features

Current implementation includes:

- Next.js App Router
- React Leaflet interactive map
- San Francisco neighborhood choropleth
- Lens switching
  - Incidence
  - Officer Enforcement
  - Resolution
- Neighborhood drill-down panel
- Mock API integration following the Sprint 2 API contract

---

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open your browser to:

```
http://localhost:3000
```

The application automatically reloads when files are modified.

---

## Project Structure

```
app/
components/
docs/
lib/
public/
types/
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `Map` | Wrapper around the Leaflet client map |
| `ClientMap` | Interactive choropleth visualization |
| `Controls` | Date and category filters |
| `LensPanel` | Lens selection |
| `NeighborhoodPanel` | Neighborhood drill-down |

---

## Data

During Sprint 2, the frontend uses mock data located in:

```
lib/mockApi.ts
```

The mock implementation follows the documented Sprint 2 API contract.

Once backend endpoints become available, the mock data can be replaced with API requests without changing the UI components.

---

## Technologies

- Next.js
- React
- TypeScript
- React Leaflet
- Leaflet

---

## Development Status

Current status:

- Next.js migration complete
- Choropleth layer implemented
- Lens switching implemented
- Neighborhood drill-down implemented
- Awaiting backend integration for production data

---

## Notes

This frontend is part of the Team LENS CSE 115A project.

The backend integration will replace the temporary mock data implementation once the Sprint 2 API endpoints are available.