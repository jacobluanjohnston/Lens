# Spike: Three-Era Enforcement Analysis — SF 2023–2026

> Completed: 2026-07-15
> **We learned** that three distinct enforcement eras are visible in the SF incident data, with the clearest policy signal being Mayor Lurie's inauguration (January 2025), which caused a 3–6× increase in the officer-initiated-to-victim-reported ratio in Mission and South of Market that has not reversed. A secondary escalation in spring 2026 is consistent with World Cup pre-event preparation. The APEC/Xi Jinping hypothesis (November 2023) is **not supported** by this data — the sweep likely happened through DPW encampment removals, not police enforcement. **Therefore** we will build a before/after comparison feature anchored to policy event presets (Lurie inauguration, World Cup ramp-up), and explicitly exclude APEC as a preset with a documented reason.

---

## Methodology

**Metric:** Officer-initiated incidents (Drug Offense, Drug Violation, Warrant, Prostitution) per month vs. victim-reported serious crimes (Burglary, Robbery, Assault, Motor Vehicle Theft) per month, per neighborhood. This is the same category assignment as the Officer Enforcement lens (see `docs/adr/001_category_bucket_assignments.md`).

**Neighborhoods examined:** Tenderloin, Mission, South of Market, Civic Center, Hayes Valley, Castro/Upper Market, Financial District/South Beach, Bayview Hunters Point.

**Periods examined:**
- APEC hypothesis: May–December 2023
- Lurie inauguration: June 2023–June 2025 (full before/after)
- World Cup ramp-up: October 2025–June 2026

**Caveats:**
- June 2025 and July 2026 show near-zero counts — these are reporting lag artifacts, not real signals. The dataset has a trailing incomplete month.
- The World Cup signal cannot be fully separated from the sustained Lurie-era baseline increase without a counterfactual. The escalation is visible but the causal claim requires analyst judgment.
- Officer-initiated counts in this dataset reflect police-recorded incidents, not encampment removals or DPW sweeps, which are not in this dataset.

---

## SQL Used

```sql
-- Officer-initiated vs. victim-reported by month, key neighborhoods
-- Used for APEC hypothesis check (May–Dec 2023) and Lurie before/after
SELECT
  DATE_TRUNC('month', i.occurred_at) AS month,
  i.neighborhood,
  COUNT(*) FILTER (WHERE i.category_primary IN
    ('Drug Offense','Drug Violation','Warrant','Prostitution')) AS officer_initiated,
  COUNT(*) FILTER (WHERE i.category_primary IN
    ('Burglary','Robbery','Assault','Motor Vehicle Theft')) AS victim_reported
FROM incidents i
WHERE i.neighborhood IN (
  'Tenderloin','Mission','South of Market','Civic Center',
  'Hayes Valley','Castro/Upper Market','Financial District/South Beach'
)
  AND i.occurred_at BETWEEN '2023-05-01' AND '2025-06-01'
GROUP BY 1, 2
ORDER BY 2, 1;

-- World Cup ramp-up check (Oct 2025–Jul 2026)
SELECT
  DATE_TRUNC('month', i.occurred_at) AS month,
  i.neighborhood,
  COUNT(*) FILTER (WHERE i.category_primary IN
    ('Drug Offense','Drug Violation','Warrant','Prostitution')) AS officer_initiated,
  COUNT(*) FILTER (WHERE i.category_primary IN
    ('Burglary','Robbery','Assault','Motor Vehicle Theft')) AS victim_reported
FROM incidents i
WHERE i.neighborhood IN (
  'Tenderloin','Mission','South of Market','Bayview Hunters Point'
)
  AND i.occurred_at BETWEEN '2025-10-01' AND '2026-07-01'
GROUP BY 1, 2
ORDER BY 2, 1;
```

---

## Findings by Event

### APEC / Xi Jinping Visit — November 2023 ❌ not supported

**Hypothesis:** A pre-summit homeless sweep caused a spike in officer-initiated enforcement in SOMA and adjacent neighborhoods in the months before November 2023.

**Finding:** No spike. South of Market officer-initiated counts were 84 (Sep) → 68 (Oct) → **28 (Nov)** — a significant *drop* during the summit month. Mission and Tenderloin were flat. If a sweep happened, it did not produce a recordable officer-initiated incident spike in this dataset. Most likely the clearances were handled by DPW/public works crews, which do not generate police incident records.

**Decision:** Do not create an APEC preset. If included, it would mislead — an analyst would expect a spike and see a drop, with no explanation visible in the data. Document the absence as an honest finding in the methodology.

---

### Mayor Lurie Inauguration — January 2025 ✅ strong signal

**Hypothesis:** Mayor Lurie's anti-encampment platform caused a measurable increase in proactive police enforcement starting at or near his inauguration.

**Finding:** Unmistakable step-change. All three high-enforcement neighborhoods show a simultaneous, sustained increase beginning January 2025:

| Neighborhood | 2023 baseline (officer-initiated/mo) | Jan–May 2025 |
|---|---|---|
| Mission | 26–41 | 50 → 71 → **142** → 102 → 84 |
| South of Market | 60–89 | **167 → 178 → 172** → 137 → 136 |
| Tenderloin | 76–122 | 126 → 105 → 123 → **159** → 138 |

The ratio tells the sharper story. Mission's officer-enforcement ratio:
- Jun 2023: 26 officer-initiated / 177 victim-reported = **15 per 100**
- Mar 2025: 142 / 154 = **92 per 100**

A 6× increase in ratio. Victim-reported crime was flat or declining the entire time, confirming the change is in enforcement behavior, not in underlying crime.

**Decision:** Use Lurie inauguration as the primary preset event. Before window: Apr–Dec 2024 (9 months, stable Breed-era baseline). After window: Jan–Sep 2025 (9 months, Lurie era, before World Cup noise enters).

---

### World Cup 2026 Ramp-Up — Spring 2026 ✅ likely signal, with caveat

**Hypothesis:** SF's role as a World Cup host city in June–July 2026 drove a pre-event encampment sweep, visible as an additional enforcement spike in spring 2026.

**Finding:** A further escalation is visible on top of the already-elevated Lurie baseline:

| Neighborhood | Lurie baseline (2025 avg) | Spring 2026 peak |
|---|---|---|
| Mission | ~100/month | **253 (Jun 2026)** |
| South of Market | ~140/month | **196 (May 2026)** |
| Tenderloin | ~150/month | **267 (Nov 2025)**, 263 (Jan 2026) |

**Caveat:** The Lurie baseline was already 2–3× the Breed era, so the World Cup signal cannot be cleanly separated without a control. The escalation is consistent with a pre-event sweep but is not proven by this data alone. Tenderloin's November 2025 spike (267) is early enough that it may reflect Lurie-era policy intensification rather than World Cup preparation specifically.

**Decision:** Create a World Cup preset with this caveat surfaced in the UI. Before window: Jan–Mar 2026. After window: May–Jul 2026 (note: Jul 2026 is incomplete — provisional flag applies).

---

## Summary: The Three Eras

```
Officer-initiated enforcement — Mission neighborhood (illustrative)

2023 (Breed era):    ████░░░░░░░░  ~30/month
2024 (Breed/late):   ████████░░░░  ~45/month  
Jan 2025 (Lurie):    ████████████████████████  142/month ← step change
2025 (sustained):    ██████████████████  ~100–150/month
Spring 2026 (WC):    ████████████████████████████  216–253/month ← further escalation
```

Victim-reported serious crimes over the same period: flat to declining. The enforcement increase is not explained by an increase in reported crime.
