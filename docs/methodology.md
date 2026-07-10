# LENS Methodology

> This document is the source of truth for how LENS measures things, why it measures them that way, and what the measurements cannot tell you. Every flag, lens, denominator choice, and category assignment is explained here. An analyst using LENS to defend a finding in a report or hearing should be able to point to this document.

---

## The core problem this tool exists to address

Police incident records are not a neutral measure of crime. They capture *police contact* — what officers recorded, in the places officers were present. Heavily-patrolled neighborhoods generate more reports, which makes them look like hotspots, which has historically justified more patrol. This feedback loop is well-documented and disproportionately harms low-income neighborhoods and neighborhoods of color.

LENS does not fix this problem. It makes it visible. Every lens and flag is designed to surface the gap between "what the data shows" and "what the data actually measures."

---

## The three lenses

All three lenses read the same underlying incident data. They ask different questions about it.

### Lens 1 — Incidence

**What it asks:** How many reported incidents happened here?

**What it measures:** Incident locations and counts, by category and time period.

**What it does not measure:** Crime. It measures police contact. A neighborhood with heavy patrol generates more reports because officers are present to notice things. Read this lens alongside Lens 2 to see how much of the count is enforcement-driven.

**Built (Sprint 1):** Incident dots on the map filtered by date range and category, using lat/lon coordinates. Neighborhood-level aggregation (choropleth) comes in Sprint 2 once the geography dimension table is loaded.

---

### Lens 2 — Officer-initiated enforcement

**What it asks:** For every 100 serious crimes a victim reported here, how many additional incidents did officers initiate on their own?

**The metric:** Officer-initiated incidents per 100 victim-reported serious crimes.

- **Numerator — confirmed core (G1 validated 2026-07-08):** Drug Offense (93.5% at-filing arrest, 0% Coplogic), Drug Violation (96.2%, 0%), Warrant (96.1%, 0%), Prostitution (87.4%, 0%), Traffic Violation Arrest (97.0%, 0%), Weapons Carrying (84.7%, 0%). The G1 data shows a clear bimodal distribution: victim-reported serious crimes cluster at 0–10% at-filing arrest (Burglary 4.3%, MVT 2.9%, Robbery 9.8%), while these categories cluster at 85–97%. That separation — not the absolute number — is what makes the classification defensible. At-filing arrest is a correlator, not proof: a civilian 911 call can still result in an officer arresting someone and filing at-filing. Zero Coplogic adds a second independent signal but has limited discriminatory power (the portal only supports certain crime types, so nearly everything shows 0%). The inference is defensible, not certain. A civilian can call 911 about a drug deal in progress; an officer responds and makes an arrest — that report also shows at-filing arrest and zero Coplogic, yet a civilian initiated the contact. This gap cannot be closed with the available data.
- **Excluded from numerator:** Civil Sidewalks (70.8% at-filing arrest — civilians routinely report nuisance behaviour, so this is not clearly officer-initiated) and Stolen Property (67.9% — victims report finding stolen property, making this category selection-dependent). Both are excluded from Lens 2 because the data does not clearly confirm officer-initiation.
- **Excluded from bucket B:** Disorderly Conduct — only 27.8% at-filing arrest. Civilians frequently call police on disorderly individuals; this is not reliably officer-initiated.
- **Denominator (victim-reported serious crime):** Burglary + Robbery + Aggravated Assault + Motor Vehicle Theft. A victim reports these regardless of patrol intensity.
- **Larceny is excluded from the denominator.** Larceny volume collapsed ~30% between 2023–2025, driven by changes in Coplogic online reporting behavior, not a real change in theft. Including it would swing ratios by reporting sensitivity, not enforcement behavior. Larceny runs as a sensitivity check only.

**What it shows:** Where enforcement concentrates relative to victim-reported need. A ratio of 7/100 (e.g. Outer Sunset) vs. 155/100 (e.g. Tenderloin) is a citable finding. Changes over time in the ratio — drug incidents tripling while victim crime is flat — are datable enforcement shifts.

**What it does not show:** Whether the concentration was justified. That is the analyst's investigation. The lens surfaces the pattern; it does not render a verdict.

**Honest limit, shown on the lens:** *"Shows where enforcement concentrates. Cannot determine whether the concentration was appropriate — that requires the analyst's investigation."*

**G1 status:** Validated 2026-07-08. Bucket assignments confirmed. Disorderly Conduct removed. Larceny exclusion confirmed by 50.3% Coplogic share. Lens 2 is buildable.

---

### Lens 3 — Resolution

**What it asks:** Of the serious crimes that happened here, how many got solved — and is that rate better or worse than the rest of the city for the same crime type?

**The metric:** Share of bucket A incidents ending in a police-recorded arrest within N days of the initial report, compared to the citywide rate for that same crime type and time period. N is per-category (G2, completed 2026-07-09): Motor Vehicle Theft 30 days, Assault 150 days, Burglary 180 days, Robbery 190 days. These cover ~90% of cases that will ever receive a resolution-changing supplement. Cases outside the window are marked provisional, not unsolved.

**In scope (bucket A only):** Burglary, Robbery, Aggravated Assault (post assault surgery — see below), Motor Vehicle Theft.

**Out of scope:**
- **Rape:** Only ~279 visible reports over 8.5 years vs. official figures in the hundreds per year — the visible sample is ~10–20% of actual cases and is non-randomly censored. Any rate calculated from this would be biased in an unknown direction. No resolution metric at any grain. Shown as a censoring exhibit: visible counts vs. official figures; the gap is the finding.
- **Homicide:** Same treatment as rape. Homicide reports are frequently filed as confidential. Shown as a censoring exhibit only.
- **All other categories:** See category bucket table below.

**How resolution is derived:** Resolution status comes from joining supplemental reports to initial reports, ordered by Report Datetime (never file order). The initial report shows resolution at time of filing — usually "Open or Active." Actual resolution updates (arrest made, case closed) appear only in supplement rows. Without this join, most resolved cases appear unresolved. See schema spike for full dedup logic.

**Exceptional clearance:** Shown separately from arrest. An exceptional clearance means the offender was identified but not arrested — victim refused to cooperate, offender died, etc. Not combined with arrest in the main metric.

**Unfounded:** Excluded from the denominator entirely. Tracked as its own diagnostic (share of unfounded by neighborhood and category).

**Assault surgery (required before building Lens 3):**
- Split Aggravated Assault from Simple Assault using the subcategory field. Only Aggravated Assault is bucket A.
- Flag domestic violence incidents separately: mandatory-arrest policy inflates at-filing arrest rates for non-investigative reasons, making DV look like high-clearance when it reflects policy, not investigative outcome.
- Remove assault-on-officer rows: these fail the station test and skew enforcement-driven clearance into the resolution metric.

**Gated on:** G1 (bucket A must show real supplement lift — resolution actually changes after join), G2 (window N), G3 (trend decomposition), G4 (external validation).

---

## Category bucket assignments

Every category gets exactly one bucket. Nothing is silently dropped — excluded categories appear in the UI with an explanation.

| Bucket | Name | Categories | Used in |
|---|---|---|---|
| A | Resolution-eligible | Burglary, Robbery, Aggravated Assault, Motor Vehicle Theft | Lens 2 denominator, Lens 3 |
| B | Officer-initiated | Drug Offense, Drug Violation, Warrant, Prostitution, Civil Sidewalks, Stolen Property (narrow); + Traffic Violation Arrest, Weapons Carrying, Disorderly Conduct (broad) | Lens 2 numerator |
| C | Censored | Homicide, Rape, Sex Offense, Human Trafficking, Offences Against Family and Children | Censoring exhibit only — visible counts vs. official figures |
| D | Victim harm, unclearable | Larceny Theft, Vandalism, Fraud/Forgery/Embezzlement, Arson, Missing Person | Lens 1 only |
| E | Administrative | Recovered Vehicle, Case Closure, Non-Criminal, Lost Property, Courtesy Report, Suspicious Occ | Excluded from all numerators and denominators |

The rationale for these assignments is in `docs/adr/001_lens2_category_membership.md`.

---

## Flags

Flags are discrete annotations that fire on a specific neighborhood when a metric crosses a threshold. They are always presented as *"anomalous relative to [reference frame]"* — never as a verdict.

The lenses and their flags are related but operate at different granularities. The lens is the continuous view — every neighborhood gets a value and the map is colored by it, so you can browse the full picture. The flag fires only when a specific neighborhood is far enough from the norm to warrant an explicit callout. The lens shows the whole story; the flag says "start your investigation here."

### Enforcement concentration flag (Lens 2)

Fires when a neighborhood's officer-initiated ratio sits significantly above the city median for a sustained period (k of m consecutive windows, minimum volume floor). The persistence requirement prevents a single unusual month from triggering a flag.

**Copy:** *"Officer-initiated enforcement here is anomalously high relative to the city median [time period]. This may reflect patrol concentration. Investigate further."*  
**Never:** *"This neighborhood is over-policed."*

### Resolution gap flag (Lens 3)

Fires when a neighborhood's clearance rate for a given crime type is significantly below the citywide rate for that same crime type and period. Always compared within crime type — never a drug-heavy area's ~100% clearance against a burglary area's 15%.

**Copy:** *"[Crime type] clearance here is [X]pp below the city rate for [period]. This may indicate under-service. Investigate further."*

### Data quality flags (always on)

These fire for every view, not just anomalous neighborhoods. They are the caveats an analyst needs to defend a finding.

**Provisional trailing window:** The most recent 60–90 days of data are incomplete — reports are still being filed and supplements still arriving. Resolution rates for this period are artificially high (only fast-closing cases exist yet); incident counts are artificially low. Any view including this window carries a provisional warning.

**Coordinate drop rate:** 5.46% of incidents have no lat/lon and are excluded from map views. This rate is not uniform across neighborhoods — uneven exclusion is itself a data-quality signal. Shown per neighborhood as *"X% of incidents in this neighborhood could not be located and are excluded from this view."*

**Withheld records:** Approximately 2.82% of incidents (juvenile records) and 5.8% (confidential records, 53% of which are domestic violence) are legally withheld from the dataset. Because the withheld records are not visible, we cannot characterise their distribution — we do not know which neighborhoods, categories, or demographics they represent. Research on juvenile justice nationally documents significant racial disparities in enforcement — tracked federally under the concept of "Disproportionate Minority Contact" (DMC), a mandate of the Juvenile Justice and Delinquency Prevention Act since 1988. Source: OJJDP, *Disproportionate Minority Contact (DMC) Literature Review*, https://ojjdp.ojp.gov/mpg/literature-review/disproportionate-minority-contact.pdf. We cannot confirm or measure this for SF from this dataset. Any analysis that would be materially affected by this gap carries a notice. This is not fixable — it is disclosed.

**Resolution trend shift (August 2024):** The overall resolution rate rose +9.1pp since August 2024. G3 found this is 62% explained by composition shift and 38% by a real within-category change. Lens 3 itself is not affected (within-period, within-crime-type comparisons). However, before/after analyses that straddle August 2024 should flag this explicitly — the citywide baseline shifted, so a neighborhood that looks "worse than the city" in 2026 vs. 2023 may simply reflect this broader rise. *Surfacing (to be built in Sprint 2):* a banner on any Lens 3 view whose selected date range crosses 2024-08-01; a static caveat in the Lens 3 sidebar on all other Lens 3 views. The date check is frontend logic against the query params — no batch job needed.

---

## Validation gates (must pass before Lens 2 and Lens 3 are built)

These are SQL queries run against the loaded data. They confirm the data supports the design — if any gate fails, the relevant lens design is revisited before code is written.

**G1 — Category screen table.** For every category: at-filing arrest share, supplement lift, Coplogic share, median per-neighborhood quarterly volume. Bucket A must show low at-filing arrest + real lift from supplements (resolution changes after join). Bucket B must show ~100% at-filing arrest AND ~0% Coplogic share. If a bucket B category shows Coplogic usage, it is not officer-initiated and gets reassigned. This table goes in the methods appendix of any published analysis.

*Completed 2026-07-08.* At-filing arrest share and supplement lift confirmed per category. Key outcomes: Disorderly Conduct removed from bucket B (27.8% at-filing arrest — not officer-initiated). Civil Sidewalks and Stolen Property demoted to sensitivity-only. Larceny exclusion confirmed (50.3% Coplogic). Supplement lift confirmed for bucket A, validating the Lens 3 join (Burglary +22%, Robbery +35%, Assault +33%). MVT lift low at 7.6% — noted as Lens 3 caveat.

**G2 — Window selection.** *Completed 2026-07-09. See `docs/spikes/g2_window_selection.md`.* Per-category N values based on p90 of time-to-resolution-changing-supplement: Motor Vehicle Theft 30 days, Assault 150 days, Burglary 180 days, Robbery 190 days. A single global N is not appropriate — MVT resolves in days while Burglary and Robbery take months. Cases outside the window are marked provisional, not unsolved.

**G3 — Trend decomposition.** *Completed 2026-07-09. See `docs/spikes/g3_trend_decomposition.md`.* The +9.1pp overall resolution rate rise since August 2024 decomposes as: +5.6pp from composition shift (62%) and +3.5pp real within-category residual (38%). Bucket A categories specifically moved only 1–3pp. Lens 3 is safe — it compares within crime type and within time period, so the trend moves both sides of any comparison together. The 3.5pp residual is disclosed: views that straddle August 2024 carry a notice that the citywide baseline has been shifting. Cause is not yet resolved (policy change? staffing? data artifact?) — that investigation is deferred to G4 and future Sprint 3 work.

**G4 — External validation.** Join LENS clearance rates against CA DOJ OpenJustice published clearance figures for SFPD. Check order of magnitude and rank order. Material divergence = an error in our join logic or denominator definition, not a finding.

---

## Known limitations

- **Citations are not captured.** Traffic stops, fix-it tickets, stop-and-talk encounters — classic proactive enforcement tools — are largely invisible in this dataset. Lens 2 undercounts officer-initiated activity.
- **SFPD only.** BART PD, US Park Police, and CHP incidents are not in this dataset. Analysis near BART stations and parks understates total enforcement.
- **Intersection-level coordinates only.** Locations are snapped to the nearest intersection for privacy. Neighborhood assignment near boundaries may be slightly off.
- **Pre-2018 data uses a different schema.** The historical dataset (2003–2017) lacks `Report Type Description`, `Filed Online`, and `CAD Number`. The proactive/reactive field inference is impossible for this period — which is why Lens 2 uses category membership instead.
- **Homicide and rape are systematically undercounted.** Do not use LENS for analysis of these categories.
- **Domestic violence is systematically undercounted.** ~53% of confidential records are DV reports. At-filing arrest rates for assault are inflated by mandatory-arrest policy, not investigative outcome — which is why assault surgery and DV flagging are required before Lens 3.
- **This tool is retrospective only.** It shows where enforcement went. It makes no claim about where enforcement should go.
