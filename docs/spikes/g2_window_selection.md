# Spike: G2 — Resolution Window Selection for Lens 3

**Question:** Lens 3 measures whether a serious crime got solved "within N days." What should N be, and should it be one value across all crime types or per-category?

**Date:** 2026-07-10  
**Script:** `pipeline/analysis/g2_window_selection.py`

---

## What we did

For every bucket A case (Burglary, Robbery, Aggravated Assault, Motor Vehicle Theft) where a supplement changed the resolution, we measured the number of days between the initial report and the resolution-changing supplement. We then looked at where 90% of those cases landed — the p90 — overall and per category.

## What we found

**Overall (all bucket A combined):**

| Percentile | Days |
|---|---|
| 50th (median) | 7 days |
| 75th | 37 days |
| 90th | 118 days |
| 99th | 500 days |
| Max | 2,291 days |

**Per category (p90):**

| Category | p50 | p90 | Max |
|---|---|---|---|
| Motor Vehicle Theft | 2 days | 26 days | 1,446 days |
| Assault | 13 days | 147 days | 2,291 days |
| Burglary | 28 days | 162 days | 1,480 days |
| Robbery | 20 days | 186 days | 1,021 days |

The categories are not interchangeable. MVT resolves in days — the vehicle is recovered and the case closes quickly. Burglary and Robbery take months. A single global N of 118 days would correctly capture 90% of MVT resolutions but only around 70% of Robbery cases. This is a real behavioral difference in how these crime types close, not a data artifact.

## Therefore

**Lens 3 uses per-category N values, not a single global N.** Defaults based on p90, rounded to the nearest sensible interval:

| Category | N (days) | Rationale |
|---|---|---|
| Motor Vehicle Theft | 30 | p90 = 26; rounded up to next round number |
| Assault | 150 | p90 = 147; rounded up |
| Burglary | 180 | p90 = 162; rounded up to 6-month interval |
| Robbery | 190 | p90 = 186; rounded up |

Cases where no resolution-changing supplement has arrived within N days are marked **provisional** — not counted as unsolved, but excluded from the clearance rate until the window closes. This is an honest distinction: a case outside the window may still close; it just hasn't yet.

These are defaults. A future version of the UI may expose N as an analyst-adjustable parameter for advanced use cases (e.g. an analyst studying cold cases may want N = 365).

## Limitations

- Based on current dataset (2018–present) only. Historical cases may have different resolution timelines.
- Right-censoring: recent cases have not had time to accumulate supplements. Re-run this analysis after each major data refresh.
- Assault here includes both aggravated and simple assault (assault surgery has not yet been performed). The p90 for aggravated assault alone may differ.
- The 6,719 cases with a resolution change are a subset of all bucket A cases — the majority never receive a resolution-changing supplement and are not included in this distribution.
