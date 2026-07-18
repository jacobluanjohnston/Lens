# Spike: Lurie enforcement shift — year-over-year validation

**Status:** closed — finding confirmed  
**Date:** 2026-07-17  
**Method:** Manual comparison using LENS compare mode, same date window (Apr–Dec vs Jan–Sep) shifted across four consecutive years

---

## Question

Is the enforcement ratio increase seen in the Lurie window (Apr 2024–Dec 2024 vs Jan 2025–Sep 2025) anomalous, or does the same Apr→Jan window produce comparable deltas in prior years? If other years show similar magnitudes, the Lurie signal could be seasonal or structural rather than policy-driven.

---

## Results

| Window | SOMA | Mission | Tenderloin | Notes |
|---|---|---|---|---|
| Apr 2021–Dec 2021 vs Jan 2022–Sep 2022 | +20 | — | +35.7 (+91.3%) | Tenderloin dominant; SOMA modest |
| Apr 2022–Dec 2022 vs Jan 2023–Sep 2023 | +12.8 | +8.2 | — | No neighborhood stands out sharply |
| Apr 2023–Dec 2023 vs Jan 2024–Sep 2024 | — | +6 | +37.3 | Treasure Island +8.9; SOMA absent from top |
| **Apr 2024–Dec 2024 vs Jan 2025–Sep 2025 (Lurie)** | **+79.3** | **+42.6** | **+29.4** | SOMA and Mission 4–6× their historical baseline |

---

## Key findings

**SOMA** runs at +12–20 in normal years. In the Lurie window it reaches +79.3 — roughly 4–6× its historical baseline for this date window. This magnitude is not reproduced in any prior year tested.

**Mission** runs at +6–8 in normal years. In the Lurie window it reaches +42.6 — approximately 5× its historical baseline. Again, not reproduced in prior years.

**Tenderloin** is consistently elevated every year (~+35–37), making it structurally hot rather than policy-responsive. Notably, the Lurie window shows Tenderloin *lower* than its historical baseline (+29.4 vs ~+35–37). This suggests enforcement shifted *toward* SOMA and Mission and *away from* the Tenderloin under Lurie — a geographic reallocation, not simply a citywide increase.

---

## Conclusion

The Lurie signal is real and geographically specific. It is not a seasonal artifact of the Apr→Jan window. No prior year produces SOMA and Mission simultaneously at this magnitude. The pattern is consistent with a policy-driven shift in enforcement geography beginning around Lurie's inauguration (January 2025) rather than a uniform citywide enforcement increase.

**Honest caveat:** this analysis uses the same date-window offset across years, which controls for seasonality but not for other confounds (economic shocks, staffing changes, data reporting changes). The finding warrants investigation by an analyst with access to department deployment records — LENS surfaces the signal, it does not confirm the cause.

---

## Future work

An automated year-over-year sweep feature (loop the same before/after window across all available years, return delta time series per neighborhood) would make this validation reproducible without manual exploration. Flagged as a future card: "Temporal anomaly detection — automated year-over-year delta comparison."
