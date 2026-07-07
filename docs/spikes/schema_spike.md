# Schema Spike — SF Crime Dataset

**Question:** What fields do the SF datasets expose, what do they mean, and how do we map them to a unified incident model?

**Source:** DataSF — SFPD Incident Report dataset "About" tab on data.sfgov.org, revised 03/2023.

---

## Critical findings for LENS

### Incident reports are not a count of crime
SF's own documentation states: *"While incident reports may serve as the basis for official crime statistics, official crime statistics are governed by the FBI's UCR and NIBRS program."* This confirms the LENS thesis — the data captures police contact, not crime.

### Double-counting risk — must deduplicate
A single incident can generate multiple rows — one per Incident Code. An officer who arrests someone on a warrant and finds drugs files two codes: one for the warrant, one for the drug offense. Both rows share the same `Incident ID` but have different `Row ID`s.

- **Counting incidents** → deduplicate on `Incident ID`
- **Counting offense types** → keep all rows
- **Getting resolution** → safe from either row, it's per-incident not per-code
- **Never count `Row ID`s naively** — that overcounts multi-code incidents

### Resolution field is stale on initial reports
*"Once a report is filed, the Resolution will not change. Status changes must be provided using a Supplemental Report."*

The initial report row shows the resolution at time of filing — usually "Open or Active." Later updates (arrest made, case closed) appear only in supplemental report rows. To get current resolution status, supplemental reports must be joined. Without joining, resolved cases look unresolved.

Resolution values:
- `Cite or Arrest Adult` — arrested or cited
- `Exceptional Adult` — cleared exceptionally (offender identified but not arrested — death, victim refused to cooperate, etc.)
- `Open or Active` — unresolved at time of report
- `Unfounded` — determined not to have occurred

This significantly complicates the resolution lens. Must decide: join supplementals (complex) or document the limitation clearly (simpler, less accurate).

### Proactive vs. reactive — inferable but not a clean field
No direct "who initiated this" field exists. Must infer from three columns:
- `Filed Online = TRUE` → Coplogic self-report → **reactive**
- `CAD Number` present → 911 dispatch → **reactive**
- `Report Type Description = "Initial"`, no CAD, not filed online → likely **proactive**

This is an approximation. Flag it as such in methodology docs. Needs distribution validation — pull a sample and check if the inference produces sensible results.

### Neighborhood is pre-assigned — use it
`Analysis Neighbourhood` is already assigned by SF for most rows. Use this instead of doing point-in-polygon. Fall back to lat/lon PIP only for rows where `Analysis Neighbourhood` is null.

### Coordinates are anonymized and incomplete
Locations are snapped to the nearest intersection — intentional privacy protection, not an error. Some coordinates are missing entirely:
- **Invalid addresses** — officer entry errors that couldn't be geocoded
- **Outside SF** — marked "Out of SF" in Police District column, no geographic data

Log dropped rows per neighborhood. Uneven drop rates across neighborhoods are themselves a data-quality signal worth surfacing.

### What this dataset does NOT capture — surface these as limitations
- **Citations** — traffic stops, fix-it tickets, stop-and-talk encounters. Classic proactive enforcement tools are largely invisible here. Our proactive measure undercounts officer-initiated activity.
- **Other agencies** — BART PD, US Park Police, CHP incidents are not in this dataset. Analysis is SFPD-only. Matters near BART stations and parks.
- **Exact locations** — intersection-level only, not exact addresses. Neighborhood assignment near boundaries may be slightly off.

### Withheld data — bias we must surface
**Juvenile records (~2.82% of 2020 data):** Legally required by California Government Code § 6254 and Welfare and Institutions Code § 827. But juvenile enforcement is heavily racialized — we cannot analyze it from this dataset. This gap must be flagged explicitly.

Breakdown of retained juvenile records by category (2020):
- Aggravated Assault: 1,521
- Offenses Against Family and Child: 1,169
- Unknown: 494
- Sex Offenses: 159
- Other: 238
- **Total: 3,581 records withheld**

**Confidential records (~5.8% of 2020 data):** Filed as confidential at request of reporting party, investigator, or chain of command. 53% of these are domestic violence reports — domestic violence is systematically undercounted. Homicide reports are frequently confidential — **homicide counts from this dataset will undercount. Do not use for homicide analysis.**

---

## Historical vs. current schema differences

| Concept | Historical (2003–2017) | Current (2018–present) |
|---|---|---|
| Incident type | `Category` | `Incident Category` |
| Description | `Descript` | `Incident Description` |
| Subcategory | *(not present)* | `Incident Subcategory` |
| Resolution | `Resolution` | `Resolution` |
| Police district | `PdDistrict` | `Police District` |
| Neighborhood | `Analysis Neighborhoods 2 2` | `Analysis Neighbourhood` |
| Latitude | `Y` | `Latitude` |
| Longitude | `X` | `Longitude` |
| Date/time | `Date` + `Time` separate | `Incident Datetime` combined |
| Report type | *(not present)* | `Report Type Description` |
| Filed online | *(not present)* | `Filed Online` |
| CAD number | *(not present)* | `CAD Number` |
| Unique row ID | `PdId` | `Row ID` |
| Unique incident ID | `IncidentNum` | `Incident ID` |

Historical dataset has many `DELETE -` prefixed columns — deprecated boundary joins, ignore entirely.

**Data quality note:** The historical dataset has a typo in its own column name — the incident number field is `IncidntNum` (missing the 'e'), not `IncidentNum`. Confirmed by inspecting the raw CSV headers. Account for this in the ingestion adapter.

**Historical dataset has no `Report Type Description`, `Filed Online`, or `CAD Number`** — the three columns used to infer proactive/reactive. Proactive/reactive distinction is not possible for pre-2018 data from this approach alone.

---

## Fields to keep

| Unified field | Current source | Historical source | Notes |
|---|---|---|---|
| `occurred_at` | `incident_datetime` | `date` + `time` combined | |
| `crime_type` | `incident_category` | `category` | Category names differ — mapping needed |
| `crime_subtype` | `incident_subcategory` | `descript` | |
| `incident_code` | `incident_code` | `incident_code` | Numeric code, human-readable label in same row |
| `resolution` | `resolution` | `resolution` | Stale on initial reports — see above |
| `neighborhood` | `analysis_neighborhood` | `analysis_neighborhoods_2_2` | Pre-assigned by SF |
| `police_district` | `police_district` | `pddistrict` | |
| `latitude` | `latitude` | `y` | Anonymized to intersection |
| `longitude` | `longitude` | `x` | Anonymized to intersection |
| `report_type` | `report_type_description` | *(not available)* | Used for proactive/reactive inference |
| `filed_online` | `filed_online` | *(not available)* | Used for proactive/reactive inference |
| `cad_number` | `cad_number` | *(not available)* | Presence = 911 dispatch = reactive |
| `incident_id` | `incident_id` | `incidentnum` | Deduplicate on this, not row ID |
| `row_id` | `row_id` | `pdid` | Unique per row, not per incident |
| `dataset` | `"current"` (hardcoded) | `"historical"` (hardcoded) | Track which source each row came from |

## Fields to ignore

- All `DELETE -` prefixed columns in historical dataset
- `ESNCAG`, `HSOC`, `Central Market`, `IIN`, `Fix it Zones` boundary columns — specialized city program boundaries irrelevant to LENS
- `CNN` — internal SF street network ID
- `Supervisor District` / `Supervisor District 2012` — political boundaries, not enforcement geography
- `data_as_of`, `data_loaded_at` — pipeline metadata
- Redundant datetime breakdowns (`Incident Year`, `Incident Day of Week`) — derivable from `occurred_at`
- `Intersection` — text description of location, superseded by lat/lon and neighborhood

---

## Data quality findings — current dataset (2018–present)

### Null rates
| Column | Null % | Implication |
|---|---|---|
| IIN Areas | 100% | Drop entirely |
| ESNCAG | 98.78% | Drop entirely |
| Civic Center / Central Market boundaries | 86%+ | Drop entirely |
| HSOC Zones | 78.44% | Drop entirely |
| `Filed Online` | 80.51% | **Not a boolean** — null means not filed online, TRUE means filed online. Cannot use absence to infer officer-initiated. |
| `CAD Number` | 22.31% | 77.69% have CAD = 911 dispatched = reactive. This is the reactive floor. |
| `Analysis Neighborhood` | 5.49% | 57,240 rows need PIP fallback or drop |
| Lat/Lon | 5.46% | 56,940 rows — drop from spatial analysis, log per neighborhood |
| `Incident Category` / `Subcategory` | 0.16% | Nearly complete |

### Coordinate validation
- 56,940 rows missing lat/lon (5.46%) — drop and log
- Zero null island (0,0) — no geocoding-to-ocean failures

### Neighborhood completeness
- 94.51% pre-assigned — only 5.49% need PIP fallback
- ~300 rows have coordinates but no neighborhood — likely on boundaries or just outside SF

### Date range
- Starts exactly 2018-01-01 — clean
- Latest record 2026-07-01 — data is current
- Zero future timestamps — clean

### Incident count by year
| Year | Count | Note |
|---|---|---|
| 2018 | 147,443 | |
| 2019 | 142,960 | |
| 2020 | 114,569 | COVID dip — 20% drop |
| 2021 | 125,159 | |
| 2022 | 132,843 | |
| 2023 | 130,871 | |
| 2024 | 110,137 | |
| 2025 | 95,436 | Right-censoring likely — recent months still being filed |
| 2026 | 43,514 | Partial year |

### Revised proactive/reactive inference
`Filed Online` being 80.51% null changes the inference approach:
- `Filed Online = TRUE` → citizen self-report → **reactive** (confirmed)
- `CAD Number` present → 911 dispatch → **reactive** (confirmed)
- Neither → **ambiguous** — could be officer-initiated OR a report filed in person at a station

Cannot cleanly identify proactive from this data alone. The 77.69% with CAD numbers are confidently reactive. The remainder need further investigation.

### CAD presence by category — challenges the inference model
Running CAD presence rate by `Incident Category` produced a counterintuitive result. Categories assumed to be officer-initiated (proactive) have *very high* CAD rates:

| Category | CAD % |
|---|---|
| Drug Violation | 96.72% |
| Drug Offense | 99.07% |
| Prostitution | 99.35% |
| Civil Sidewalks | 99.70% |
| Warrant | 97.20% |

The *lowest* CAD categories are:
| Category | CAD % | Why |
|---|---|---|
| Lost Property | 38.16% | Citizen discovers loss, walks in or files online — no 911 |
| Larceny Theft | 47.99% | Some walk-in/online reports |
| Case Closure | 63.82% | Administrative |

**Implication:** CAD absence does not reliably identify officer-initiated incidents. The low-CAD categories are citizen-reported walk-ins, not patrol stops. Either citizens are calling 911 about drug activity at nearly the same rate as burglaries, or officers log CAD even for patrol-initiated stops. Either way, CAD is not a clean reactive/proactive signal at the category level.

**Revised inference approach:** Use `Report Type Description` as the primary classifier:
- `Coplogic Initial` / `Coplogic Supplement` → citizen online self-report → **reactive**
- `Vehicle Initial` / `Vehicle Supplement` → vehicle-related report → **reactive**
- `Initial` with CAD → 911-dispatched → **reactive**
- `Initial` without CAD → **ambiguous** (officer-initiated or station walk-in)
- Supplement rows → follow-up, not a new incident — handle separately

### Report Type Description distribution
| Type | Count | % |
|---|---|---|
| Initial | 634,940 | 60.88% |
| Coplogic Initial | 182,519 | 17.50% |
| Initial Supplement | 88,890 | 8.52% |
| Vehicle Initial | 69,682 | 6.68% |
| Vehicle Supplement | 46,127 | 4.42% |
| Coplogic Supplement | 20,774 | 1.99% |

`Filed Online = TRUE` maps exactly to Coplogic reports — it is redundant with `Report Type Description`. Drop `Filed Online`; use `Report Type Description` instead.

### Report lag
- Median: 0.1 days (same day)
- Mean: 11.1 days (pulled up by outliers)
- 90th percentile: 8.4 days
- 99th percentile: 282.7 days (~9 months)
- Max: 3,019 days (~8 years — data entry error)
- Negative lag (report before incident): 9 rows — drop these

### Right-censoring check
Resolution rate by month shows an *increasing* trend (22% in Aug 2024 → 40% in Jun 2026), not a drop in recent months. Rerunning with Initial-only rows confirms the trend persists (27% → 46%) — it is **not a supplement artifact**. Something real changed in SF enforcement/resolution patterns between late 2024 and 2026. Not yet explained. 2026-07 at 63.4% from only 194 records is confirmed right-censoring for an incomplete month.

**Implication for the resolution lens:** Use with caution for before/after temporal comparisons. The lens is more reliable for cross-neighborhood comparison within a single time window than for comparing a neighborhood to its own history across 2024–2026.

### Supplemental reports CAN be joined to Initial reports via Incident Number
`Incident ID` is unique per filed report — wrong join key. `Incident Number` is the correct linking field. A supplement and its corresponding initial share the same `Incident Number`, confirmed via a CAD-verified pair (`Incident Number = 250126929`).

**Join results (all initial types: Initial, Coplogic Initial, Vehicle Initial):**
- ~92% of supplement rows (144,057 of 155,791) link to an initial in the current dataset via `Incident Number`
- 14.8% of joined pairs show resolution changed in the supplement — joining matters
- 11,734 supplement rows cannot be linked to the current dataset:
  - 2,301 (19.6%) link to the historical (pre-2018) dataset
  - 9,433 (80.4%) are in neither dataset — likely expunged/deleted reports, other-agency reports, or pre-2003 incidents. ~6% of all supplements — document and move on.

**Note:** An earlier figure of "63.6%" was comparing unique matched Incident Numbers (99,110) against total supplement rows (155,791) — a meaningless ratio. The correct figure is per-row linkage: ~92%.

**Decision:** Join supplements to initials via `Incident Number` when building the resolution lens. For the ~6% unlinkable, use initial report resolution and surface as a minor data quality note.

### No-CAD residual bucket
Only 2.8% of rows (29,421) have no CAD and are not Coplogic. Top categories are Recovered Vehicle (walk-in to report a found vehicle) and Case Closure (administrative). This bucket is not officer-initiated patrol stops — it is administrative and walk-in reports. Too small and too mixed to build a flag on. Drop this approach.

### Bucket definitions — what they can and cannot claim
We cannot label a bucket "enforcement-heavy" or "officer-initiated" because we have no reliable way to identify officer-initiated incidents in this dataset. Doing so would be importing an assumption from the literature, not measuring it.

What the data does support is **incident composition** — the share of each offense type per neighborhood compared to the city median. Two buckets:

| Bucket | Categories | What it measures |
|---|---|---|
| Serious victim-reported crime | Burglary, Robbery, Assault, Rape, Homicide, Motor Vehicle Theft | A victim called. The incident wouldn't be in the data without them. |
| Quality-of-life offenses | Drug Violation, Drug Offense, Civil Sidewalks, Prostitution, Disorderly Conduct, Warrant | These *could* be officer-initiated or citizen-called. The data cannot distinguish. |

**The signal:** A neighborhood with a disproportionately high share of QoL offenses relative to serious victim crime has a different enforcement *composition* than the city median. That composition pattern correlates with over-policing in the criminology literature — but LENS does not claim causation. The flag says "anomalous composition" and names the limitation explicitly. The analyst draws their own conclusion.

**What we do not claim:** That any individual incident was officer-initiated. That QoL offenses are inherently enforcement-driven in SF. These are literature-informed framing choices, not measurements.

### Resolution lens — methodology decisions (from expert review)

**Restriction to victim-reported crimes is correct scoping, not a compromise.** The criterion is *selection-independence*: a category belongs in clearance analysis only if incidents exist in the data whether or not they were resolved. Burglary yes (recorded regardless of arrest). Drug possession no (usually only recorded because someone was caught — the arrest IS the presence condition). This is the criminology convention; present it as correct, not as a limitation.

**The two lenses together are the product.** Enforcement composition (where police contact is chosen) + resolution gap (where victim harm goes unanswered) = the over-policed and under-protected framing in the accountability literature. One principled partition of the category space feeds both lenses — high self-resolution categories go to enforcement composition; low self-resolution, selection-independent categories go to the resolution lens.

**Data model: fold to Incident Number level.** Three key levels exist: `Row ID` (code-row), `Incident ID` (filed report), `Incident Number` (case). The resolution lens operates at case level — fold to one record per `Incident Number`, resolution taken from the latest report by `Report Datetime`, before computing anything.

**Category inclusion screen (replaces curated list).** Produce one table in the methods appendix: category × at-filing arrest share × supplement lift × median per-neighborhood quarterly volume. Inclusion thresholds stated explicitly. Categories that fail the screen route to the enforcement composition lens — not discarded.

**Flag criterion redesign.** "Below city median" fires on half of neighborhoods by construction — it's noise. Replace with a funnel plot per category × window: clearance rate vs. incident volume with 95%/99.8% control limits around citywide rate. Add: persistence rule (flag sticks only if breached in k of last m windows), minimum cell suppression (grey out if expected arrests < 5). Defensible sentence: "we flag only neighborhoods statistically distinguishable from the citywide rate given their volume."

**Display.** Headline metric: unresolved share within fixed follow-up window — "78% of 2024 burglaries in X had no arrest recorded within 12 months." Behind it, three-way split: Arrest/Cited, Exceptional, Open. Show counts alongside rates (300 unresolved at 85% vs. 12 at 92% are different stories). On the map, use category-stratified observed/expected ratio — the only single number that isn't secretly a category-mix statistic.

**Unfounded** — remove from denominator (the crime didn't occur); show in its own diagnostic view. Differential unfounding rates by neighborhood are a known oversight signal for assault.

**Exceptional clearance** — display separately, never silently counted as resolved. Show arrest-only as primary; with-exceptional as sensitivity. (2018 reporting on exceptional-clearance abuse in rape cases means any pooled "resolved" number including it will be challenged first.)

**Rape: citywide only.** Confidential withholding is disproportionately sex-offense/DV; neighborhood cells are too small and doubly broken.

**Assault: check subcategory.** If `Incident Subcategory` separates assault-on-officer, purge it — self-resolving, not investigative response. Check whether DV can be split out; mandatory arrest policy inflates at-scene arrest for DV for reasons unrelated to investigation.

**Fixed follow-up window.** Right-censoring applies to the joined resolution data: a 2019 burglary has had 7 years to accumulate supplements; a 2026 burglary has had weeks. Define metric as "arrest recorded within N days of report." Choose N so the window covers ~90% of the time-to-update distribution. Exclude or label as provisional any period whose window hasn't matured.

**Epistemic label on every output:** "Police-recorded resolution within N days of report; excludes charging and conviction outcomes; unfounded shown separately."

---

## Open questions

1. **Resolution joins** — ✅ Resolved: join on `Incident Number` (not `Incident ID`). ~92% of supplement rows link to a current-dataset initial; 14.8% of those change resolution. Of the ~8% unlinkable: 19.6% are in the historical dataset, 80.4% are in neither (expunged/other-agency/pre-2003). Flag the ~6% truly unresolvable as a minor data quality note.
2. **Resolution consistency across multi-code rows** — ✅ Verified on both datasets:
   - **Current (2018–present):** Zero incidents with varying Resolution across codes. Safe to take Resolution from any row for a given Incident ID.
   - **Historical (2003–2017):** 260 of 1,651,726 incidents (0.016%) have inconsistent Resolution values across their rows. Decision: drop these 260 incidents from resolution analysis and log them as ambiguous.
3. **Proactive/reactive** — ✅ Resolved: cannot cleanly separate in this dataset. CAD presence is not a valid signal (96–99% on drug/prostitution/warrant). Use incident composition instead; surface limitation explicitly in methodology.md.
4. **Category inclusion screen** — needs empirical computation: per-category at-filing arrest share, supplement lift, time-to-update distribution, median quarterly volume per neighborhood. Determines final included categories and fixed follow-up window length.
5. **Upward resolution trend 2024–2026** — likely compositional (growing proactive share, not changing victim-crime clearance). Three tests needed: monthly trend within restricted categories only; frozen-weight test; proactive share by month vs. resolution curve. Determines whether longitudinal comparisons are publishable.
6. **Category mapping** — historical `Category` values and current `Incident Category` values differ. Mapping table needed before combining datasets.
7. **Chicago** — schema spike still needed.

---

## Therefore

We will:
- Fold data to `Incident Number` (case) level for the resolution lens; `Incident ID` for deduplication elsewhere; never count `Row ID`s
- Use `Analysis Neighbourhood` as primary neighborhood assignment; fall back to lat/lon PIP for null rows
- Restrict resolution lens and resolution gap flag to selection-independent categories (empirical screen: low at-filing arrest share + positive supplement lift). Present as correct scoping, not a scope compromise.
- Use incident composition (QoL share vs. victim-crime share per neighborhood vs. city median) for the enforcement composition flag — literature-informed framing, named limitations, no claim of individual officer-initiation
- Replace "below city median" flag criterion with funnel plot + persistence rule + minimum cell suppression
- Rape analysis: citywide only
- Exceptional clearance: display separately, never silently pooled into "resolved"
- Unfounded: remove from denominator, show in its own diagnostic view
- Define resolution metric with a fixed follow-up window; label provisional periods
- Surface withheld juvenile and confidential records as explicit data-quality flags
- Never use this dataset for homicide counts
- Log and surface dropped rows per neighborhood (missing coordinates, outside SF boundaries)
- Track `dataset` field to distinguish historical vs. current rows throughout the pipeline
