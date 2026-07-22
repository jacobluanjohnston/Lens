# Sprint 4 Plan — LENS

**Product:** LENS
**Team:** LENS
**Sprint completion date:** July 22, 2026
**Revision:** 1.0 — July 14, 2026

---

## Goal

An analyst can select a policy event (Mayor Lurie's inauguration, World Cup SF), see which neighborhoods' enforcement behavior changed most before vs. after, read a ranked list of biggest movers, generate a downloadable PDF report, and share a live deployed URL — without knowing any dates or doing any math.

---

## Team Roles

| Member | Role |
|---|---|
| Jacob | Tech Lead, Backend Developer, Scrum Master |
| Louisa | Frontend Developer |
| Ishita | Data Engineer, Frontend Developer |
| Preetam | Backend Developer |
| Heli | Full-stack Developer |

---

## Scrum Times

- **Monday / Wednesday / Friday** — async standup via Discord
- **Lab section (Wednesday)** — TA check-in
- **As needed** — PR review turnaround target: same day

---

## Task Listing by User Story

*Full card definitions with acceptance criteria are in `docs/sprint_reports/sprint4.md`.*

---

### User Story 1 — Before/After enforcement comparison
*As an analyst, I want to compare enforcement in two time windows so I can see which neighborhoods changed most after a policy event.*

**Card 1 — Compare endpoint (5 pts)**

| Task | Estimate |
|---|---|
| `GET /lens/compare` endpoint accepting 4 date params | 2 hrs |
| Compute per-neighborhood delta from rollup table | 2 hrs |
| Null safety: neighborhoods with zero victim crimes return `delta: null` | 1 hr |
| Tests: valid request returns 41 rows, missing param returns 422, null delta safe | 2 hrs |

**Total: ~7 hrs (Preetam)**

**Card 2 — Compare mode UI (5 pts)**

| Task | Estimate |
|---|---|
| "Compare" toggle in controls bar; shows Before/After date pickers | 2 hrs |
| Fetch `/lens/compare` on date change; store in state | 1 hr |
| Diverging red/blue choropleth keyed to delta | 3 hrs |
| Neighborhood panel in compare mode: before ratio, after ratio, delta, % change | 2 hrs |
| Client-side validation: After end ≤ After start blocks request | 1 hr |

**Total: ~9 hrs (Louisa)**

---

### User Story 2 — Policy event presets
*As an analyst, I want to select a preset event so I don't have to manually enter four dates.*

**Card 3 — Policy event presets (3 pts)**

| Task | Estimate |
|---|---|
| Preset dropdown (Lurie, World Cup) auto-fills all four date pickers | 2 hrs |
| Provisional data warning fires for World Cup (end date within 90 days) | 1 hr |
| Frontend unit test: selecting Lurie preset fills correct dates | 1 hr |

**Total: ~4 hrs (Heli)**

---

### User Story 3 — Neighborhood rankings
*As an analyst, I want a ranked list of all neighborhoods so I can find the biggest movers without clicking each one.*

**Card 4 — Neighborhood rankings sidebar (3 pts)**

| Task | Estimate |
|---|---|
| Ranked list component below neighborhood panel, sorted by active metric | 3 hrs |
| Re-sorts live on lens change; clicking a row selects that neighborhood | 1 hr |
| Selected neighborhood highlighted; list independently scrollable | 1 hr |

**Total: ~5 hrs (Ishita / Louisa)**

---

### User Story 4 — Plain-language copy
*As a non-technical analyst, I want the app to use plain language so I can explain findings without jargon.*

**Card 5 — Language simplification (1 pt)**

| Task | Estimate |
|---|---|
| Copy pass: rename all Lens 2 labels to plain language (see card spec) | 1 hr |

**Total: ~1 hr (Jacob)**

---

### User Story 5 — Shared deployment
*As a teammate, I want a shared URL so I can use the app without running it locally.*

**Card 6 — Deployment (3 pts)**

| Task | Estimate |
|---|---|
| Configure Docker Compose for server deployment | 2 hrs |
| Auto-run migrations on backend startup | 1 hr |
| Expose via ngrok or similar; update README with URL | 1 hr |

**Total: ~4 hrs (Heli)**

---

### User Story 6 — CI frontend tests
*As a developer, I want Jest tests in CI so that critical frontend logic can't regress silently.*

**Card 11 — CI: wire frontend tests (5 pts)**

| Task | Estimate |
|---|---|
| Add `npm test` step to `ci.yml` | 1 hr |
| Extract `metricFor` and `isProvisionalDate` into `lib/lensLogic.ts` | 1 hr |
| `frontend/__tests__/LensLogic.test.tsx`: metricFor + provisional flag tests | 2 hrs |
| `backend/tests/test_lens_calculations.py`: category bucket + per-capita tests | 2 hrs |

**Total: ~6 hrs (Louisa)**

---

### Stretch — Controls bar responsive (Card 7, 2 pts)
*As an analyst on a narrow screen, I want the controls bar to reflow so all date pickers remain accessible.*

| Task | Estimate |
|---|---|
| CSS breakpoint system: cap bar width at medium viewports | 2 hrs |
| CSS variable shrink for month pickers in compare mode | 1 hr |
| Mobile: wrap to rows, verify all inputs reachable at 375px | 2 hrs |

**Total: ~5 hrs (Louisa)**

---

### Stretch — Generate Report / Identify Anomaly (Card 13, 8 pts)
*As an analyst, I want to download a PDF report so I can share findings with a supervisor or present at a hearing.*

| Task | Estimate |
|---|---|
| "Identify Anomaly" button in compare mode; configuration modal (start/end year) | 2 hrs |
| `runReportWithFocus`: fetch compare endpoint for each year-pair sequentially | 3 hrs |
| Anomaly assessment: mean + 2SD of pre-event historical deltas | 2 hrs |
| `exportReportPdf.ts`: jsPDF layout — header, anomaly verdict, year-by-year table, methodology note | 3 hrs |
| Thread selected neighborhood ID into report; cross-year validation with tooltip | 2 hrs |

**Total: ~12 hrs (Ishita / Jacob)**

---

## Initial Task Assignment

| Member | First assignment |
|---|---|
| Jacob | Card 5 (language) → Card 13 stretch (report logic) |
| Louisa | Card 2 (compare mode UI) → Card 7 (responsive) → Card 11 (CI tests) |
| Ishita | Card 4 (rankings) → Card 13 stretch (PDF export) |
| Preetam | Card 1 (compare endpoint) |
| Heli | Card 3 (presets) → Card 6 (deployment) |

---

## Initial Burnup Chart

Chart generated at sprint close. See `docs/sprint_reports/sprint4_burnup.png`.
