# ADR 002 — Frontend Framework: Next.js over React + Vite

**Date:** 2026-07-10
**Status:** Decided

---

## Context

LENS was originally scaffolded with React + Vite. The rationale in CLAUDE.md was: no SSR need → no Next.js. The concern was that Next.js adds server-side rendering complexity, and that Leaflet (the map library) is browser-only and fights SSR.

When the frontend work was assigned to a teammate for Sprint 2, she raised the question of switching to Next.js, which she has more experience with.

---

## Decision

Switch to **Next.js**. Replace the existing React + Vite scaffold.

---

## Why we changed our mind

An experienced developer we consulted pointed out that:

1. **The SSR complexity concern was overstated.** Leaflet's browser-only requirement is a known issue in Next.js but a two-line fix (`dynamic()` with `ssr: false`). The rest of the code looks nearly identical between Vite and Next.js.

2. **Next.js is better for extensibility.** If LENS ever grows beyond a single-page tool — shareable report URLs, user accounts, saved analyses, public-facing pages — Next.js handles that naturally. Adding those to a Vite SPA means bolting on a router and re-architecting. Next.js reserves the option without forcing it now.

3. **Team familiarity matters.** Our frontend developer knows Next.js well, and we have access to friends with Next.js experience. Productivity and support outweigh the marginal benefit of staying with Vite.

---

## What changes

The existing `frontend/` scaffold (Vite config, `index.html`, `vite.config.ts`, `tsconfig.node.json`) is replaced with a Next.js project. Dependencies change from `vite` + `@vitejs/plugin-react` to `next`. React, TypeScript, Leaflet, and Recharts remain.

The proxy config in `vite.config.ts` (which forwarded `/incidents`, `/categories`, `/health` to the FastAPI backend) is replaced with Next.js `rewrites` in `next.config.js`.

All application code in `src/` is migrated. The map components that use Leaflet are wrapped in `dynamic(() => import(...), { ssr: false })`.

---

## Migration guide

### Delete these files
- `frontend/vite.config.ts` — replaced by `next.config.js`
- `frontend/index.html` — Next.js does not use one
- `frontend/tsconfig.node.json` — Next.js manages this internally

### Rewrite
- `frontend/package.json` — remove `vite` and `@vitejs/plugin-react`; add `next`. React, TypeScript, Leaflet, and Recharts stay.

### Keep and migrate
- `frontend/src/App.tsx` — port the map and controls logic into a Next.js page (e.g. `app/page.tsx` or `pages/index.tsx`)
- `frontend/src/index.css` — keep as-is
- `frontend/tsconfig.json` — mostly the same; Next.js will want minor adjustments (it scaffolds its own on `npx create-next-app`)

### Leaflet gotcha
Leaflet assumes `window` exists and cannot run server-side. Any component that imports from `react-leaflet` must be wrapped with `dynamic()`:

```tsx
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('../components/Map'), { ssr: false })
```

Do this once for the map component and the rest of the app works normally.

### Proxy config
`vite.config.ts` forwarded `/incidents`, `/categories`, and `/health` to the FastAPI backend. In Next.js this goes in `next.config.js` as rewrites:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/incidents/:path*', destination: 'http://localhost:8000/incidents/:path*' },
      { source: '/categories/:path*', destination: 'http://localhost:8000/categories/:path*' },
      { source: '/health/:path*',     destination: 'http://localhost:8000/health/:path*' },
    ]
  },
}

module.exports = nextConfig
```

In Docker, replace `localhost:8000` with the backend service name (same pattern as the old `VITE_API_TARGET` env var).

---

## What does not change

- React and TypeScript remain
- Leaflet / react-leaflet for the map
- Recharts for charts
- The FastAPI backend is unchanged — Next.js is a frontend-only change
- Docker Compose wiring — the frontend container still runs on the same port

---

## Consequences

- Teammate can work in a framework she knows well
- Future features (shareable URLs, auth, public pages) are easier to add
- Leaflet requires `dynamic()` wrapping — one-time setup cost, not ongoing friction
- CLAUDE.md tech stack table updated to reflect this decision
