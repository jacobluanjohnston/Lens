# Spike: G3 — Resolution Rate Trend Decomposition

**Question:** The overall SF resolution rate rose from ~12.6% to ~21.7% between August 2024 and mid-2026 — a +9.1 percentage point rise. Is this a composition shift (the mix of crime types changed, making the overall rate rise even if individual crime type rates stayed flat), or a real within-category change (clearance rates for specific crime types actually improved)? And does either answer affect Lens 3?

**Date:** 2026-07-10
**Script:** `pipeline/analysis/g3_trend_decomposition.py`

---

## What we did

We ran a composition shift test: freeze the pre-August-2024 category mix (the share each crime type contributes to total volume) and apply it to post-August-2024 data. If the frozen-weight rate matches the observed post rate, composition explains the rise. If the observed rate is higher, a real within-category change is present.

We also looked at per-category resolution rates before and after the breakpoint to identify which specific categories changed.

## What we found

**Overall decomposition:**

| | Rate |
|---|---|
| Before August 2024 | 12.6% |
| After August 2024 | 21.7% |
| Observed change | +9.1pp |
| Explained by composition shift | +5.6pp (62%) |
| Residual within-category change | +3.5pp (38%) |

The result is mixed. Composition explains most of the rise but a real within-category component of 3.5 percentage points remains unexplained.

**The big movers (G3b) are not bucket A:**

The categories with the largest post-August-2024 resolution rate changes are:
- Unknown: +22.0pp
- Vehicle Impounded: +17.0pp
- Other Miscellaneous: +14.6pp
- Disorderly Conduct: +12.3pp
- Recovered Vehicle: +11.8pp

**Bucket A categories specifically showed minimal change:**

| Category | Before | After | Change |
|---|---|---|---|
| Assault | 23.7% | 23.8% | +0.1pp |
| Motor Vehicle Theft | 7.2% | 8.4% | +1.2pp |
| Burglary | 7.2% | 9.6% | +2.4pp |
| Robbery | 14.4% | 17.3% | +2.9pp |

## Therefore

**Lens 3 is safe.** The 3.5pp within-category residual is real but is not concentrated in the bucket A categories that Lens 3 uses. More importantly, Lens 3 never makes a cross-time comparison — it always compares a neighborhood's clearance rate against the citywide rate for the same crime type in the same time period. If the whole city's burglary clearance improved from 7% to 9%, and a neighbourhood went from 4% to 6%, the gap is the same. The trend moves both sides of the comparison together.

The trend would break Lens 3 if the lens made before/after claims like "this neighbourhood's current clearance is below what SF achieved in 2022." It does not. All comparisons are within-period.

**The 3.5pp residual is disclosed, not suppressed.** Analysts reading Lens 3 output should know the citywide baseline has been shifting since August 2024. The cause is not fully explained — possible causes include policy changes, staffing changes, or a data artifact from supplement filing patterns. This is noted in the UI and in the methodology. Before/after claims that specifically compare pre- and post-August-2024 periods should flag this trend explicitly.
