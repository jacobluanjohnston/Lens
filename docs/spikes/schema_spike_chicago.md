# Schema Spike — Chicago Crime Dataset

**Question:** Same as SF — what fields does the Chicago dataset expose, what do they mean, how do they map to the unified incident model, and where does the SF-derived model break?

**Sources:** Chicago Crimes (2001–Present), data.cityofchicago.org (ijzp-q8t2). Consolidates `chicago_dataset_profiling.md` and `Chicago_Dataset_Findings.pdf` (June–July 2026 pulls); supersedes both. Items marked **OPEN** have no answer yet. Items marked **PROPOSED** need team ratification.

**Snapshot note:** The two source analyses used different pulls (8,587,239 rows / 8,586,614 Case Numbers vs. 8,585,936 "total incidents") — ~678-record drift, consistent with a one-day gap on a daily-updated portal. See Therefore: pin one snapshot per analysis cycle and record the pull date here.

---

## Critical findings for LENS

### One row ≈ one incident — the opposite of SF

8,587,239 rows vs. 8,586,614 unique Case Numbers: only 521 incidents carry multiple offense codes (max 6, mean 2.20). SF treats multi-code rows as a first-order dedup hazard; in Chicago it is a 0.006% edge case.

**OPEN:** A disparity this large is a recording-rule difference, not a behavioral one. Does Chicago record only the primary / most-severe IUCR per incident? If yes, offense-level counts are not comparable to SF's (SF enumerates all codes per incident; Chicago would be suppressing secondaries). Check the dataset About page and CPD/CLEAR documentation. Until resolved, cross-city offense-mix comparisons are unsafe.

Dedup rule regardless: count incidents on `Case Number`, never on `ID`. The 5 incidents with conflicting Arrest values across their rows: drop from outcome analysis and log as ambiguous (mirrors SF's decision on its 260 historical resolution conflicts).

### Arrest is the only outcome field — and its temporality is unverified

Chicago exposes a boolean `Arrest`. There is no analog to SF's four-value Resolution: no exceptional clearance, no unfounded, no open/active distinction.

**OPEN — highest-priority question in this document.** SF's most consequential spike finding was that Resolution freezes at filing (updates live only in supplemental reports). Nobody has asked the Chicago equivalent: is `Arrest` frozen at report time, or updated in place when an arrest happens later? The `Updated On` column implies records are revised after filing, and the row-count drift between our two pulls proves the dataset mutates between snapshots — but whether `Arrest` is among the fields that mutate is unverified.

This determines everything about outcome lenses. If Arrest updates in place, Chicago arrest rates reflect *current* case status while SF initial-report resolutions reflect *filing-time* status — a silent apples-to-oranges in any cross-city comparison.

Test: diff two pulls ~2 weeks apart on shared Case Numbers and look for False→True transitions; also read the portal FAQ/About for update semantics.

Consequence: **do not drop `Updated On` at ingestion** (revising the findings PDF's drop list) — it is the only instrument we have for this investigation.

### Proactive vs. reactive — CAD method impossible; category method proposed

No CAD Number, no Filed Online, no Report Type Description. The SF inference route does not exist here; this dataset cannot distinguish 911-dispatched from officer-initiated contact by provenance fields (findings PDF, confirmed).

**PROPOSED:** Adopt the fallback from SF open question #4 as the *unified* method — classify proactive by offense category (narcotics possession, prostitution, warrant service, loitering/trespass are officer-initiated at scale; IUCR gives clean handles). We have a validation path SF alone doesn't: SF 2018+ CAD presence is ground-truth reactive labeling. Score the category heuristic against SF's CAD labels first; if it validates, apply it to Chicago and SF-historical. That would make it the only proactive measure covering all three data slices.

### Neighborhood geography — Community Area, not Ward

`Community Area` (1–77, boundaries stable since the 1920s) is the analysis unit. Needs a number→name lookup table at ingestion.

7.15% missing overall, but concentrated in time, not space: 98.69% missing in 2001, 27.24% in 2002, below 0.1% thereafter — and geographically near-uniform (~7% per district; District 2 a mild outlier at ~10.45%). Treat the 76 rows with `Community Area = 0` as null (0 is not a valid area).

**PROPOSED:** Exclude or flag 2001–2002 in neighborhood-level lenses. Citywide and District-level lenses are unaffected (District has 47 nulls total).

`Ward` (7.16% missing) is aldermanic geography — political boundaries, redistricted every decade. The same reasoning that had SF ignore Supervisor District applies here. **PROPOSED:** drop, unless a ward-accountability lens is explicitly wanted.

Per-capita rates: raw counts favor populous areas (findings PDF flags this correctly). Community Area–level population is publicly available (census/CMAP) — an enhancement, not a blocker.

### Coordinates — block-anonymized, missing-together, a few true errors

1.13% of rows (96,910) are missing lat/lon, always jointly with X/Y/Location (single upstream derivation). Zero null-island rows. At least one coordinate pair lands near the Missouri/Arkansas border — true geocoding errors exist but are negligible in count.

**PROPOSED:** Coordinates outside an Illinois bounding box → strip the coordinates, keep the record, log it (a wrong geocode doesn't invalidate the incident). Rows with no coordinates → aggregate lenses only; log drop rates per Community Area (SF parity — and the findings PDF's own open item about whether the 1.13% clusters geographically is still unchecked).

Addresses are block-level by design (privacy), analogous to SF's intersection snapping. Both are fine at neighborhood granularity.

### Recency — trailing months systematically undercount

June 2026 shows 16,554 incidents vs. May's 20,841 and April's 18,991, and vs. June 2025's 21,131 — filing lag, not a crime drop. **PROPOSED:** flag the trailing 90 days as provisional in every time-series output.

### What's included / excluded — mostly unasked (**OPEN**)

Known: CTA/transit crime **is** included (contrast: SF excludes BART PD). Everything else on this list SF answered for its data and Chicago hasn't:

- **Juvenile incidents** — included, anonymized, or withheld? (SF withholds ~2.8% of records.)
- **Expunged records** — Illinois ran mass cannabis expungements after legalization. Were expunged arrests removed from this dataset? If so, historical drug-enforcement disparities are partially erased from the record — must be surfaced if true.
- **Other agencies** — Illinois State Police (expressways — expressway incidents likely absent), Cook County Sheriff, university PDs. The CPD-only scope needs the same explicit limitation note SF has for BART PD / Park Police / CHP.
- **Confidentiality withholding** — any analog to SF's ~5.8% confidential filings (53% of which are DV)? Note the asymmetry: Chicago exposes a `Domestic` flag while SF's DV is systematically hidden in confidential records — a domestic-violence lens is effectively Chicago-only.
- **Portal disclaimers** — SF's spike anchors on DataSF's own "incident reports ≠ official crime statistics" language. Quote Chicago's equivalent disclaimer (preliminary data, reclassification) for methodology.md.

---

## Fields to keep (PROPOSED unified mapping)

Chicago forces two revisions to the unified model itself: a `city` dimension (the SF-only model's `dataset` field just distinguishes historical/current), and splitting the outcome into `arrest_made` (the cross-city floor) plus `resolution_detail` (SF-only richness).

| Unified field | Chicago source | Notes |
|---|---|---|
| `city` | `"chicago"` (hardcoded) | **new field — model revision** |
| `dataset` | `"chicago-2001-present"` (hardcoded) | single schema; no historical/current split |
| `occurred_at` | `Date` | confirm parse format and America/Chicago tz on ingest |
| `crime_type` | `Primary Type` | crosswalk to SF `Incident Category` needed — open question 5 |
| `crime_subtype` | `Description` | |
| `incident_code` | `IUCR` | treat as string (leading zeros) |
| `fbi_code` | `FBI Code` | Chicago-only; candidate anchor for a cross-city taxonomy |
| `arrest_made` | `Arrest` | **model revision** — SF derives: `resolution == 'Cite or Arrest Adult'` |
| `resolution_detail` | *(n/a)* | SF-only |
| `domestic` | `Domestic` | effectively Chicago-only signal (see confidentiality note above) |
| `neighborhood` | `Community Area` | `0` → null; join 1–77 name lookup |
| `police_district` | `District` | 47 nulls |
| `latitude` / `longitude` | `Latitude` / `Longitude` | block-anonymized; Illinois bounding filter |
| `report_type` / `filed_online` / `cad_number` | *(n/a)* | proactive inference via categories instead |
| `incident_id` | `Case Number` | dedup key |
| `row_id` | `ID` | unique — 0 duplicates verified |

## Fields to drop

- `X Coordinate` / `Y Coordinate` / `Location` — redundant with lat/lon
- `Block` — redundant once lat/lon + Community Area are present
- `Year` — derivable from `occurred_at` (SF parity: redundant datetime breakdowns)
- `Beat` — sub-district patrol unit; defer unless a beat-level lens is requested
- `Ward` — **PROPOSED** drop (political geography; see above)
- `Updated On` — **retain through ingestion** pending the Arrest-temporality investigation; drop only after open question 1 is resolved

---

## Data quality summary (verified)

| Check | Result |
|---|---|
| Rows / unique Case Numbers | 8,587,239 / 8,586,614 (pull A); 8,585,936 (pull B) — pin snapshots |
| Duplicate `ID`s / exact duplicate rows | 0 / 0 |
| Null rates | Ward 7.16%, Community Area 7.15%, lat/lon + derived 1.13%, Location Description 0.19%, District 47 rows; all other columns 0% |
| Coordinate integrity | 0 null-island; ≥1 out-of-state pair; missing coords perfectly co-missing |
| Invalid values | 76 rows with `Community Area = 0` |
| Arrest distribution | 2,150,918 True / 6,436,321 False (~25% overall) |
| Community Area missingness by year | 2001: 98.69% → 2002: 27.24% → <0.1% thereafter |
| Multi-code incidents | 521 (0.006%); 5 with conflicting Arrest; max 6 codes; mean 2.20 |

**Signal preview** (findings PDF): theft arrest rates span 6.94%–16.63% across high-volume districts (>2x spread), and Community Area 65 arrests at 26.87% on 17,445 thefts vs. Area 8's 13.39% on 118,586 — volume and enforcement intensity decouple. Before this ships in the product: state the minimum-volume filter for the community-area rate table explicitly (districts 21 and 31 were excluded for small n; the CA table needs the same documented threshold).

## Not yet profiled (SF parity checklist)

- **Date-range validation** — future timestamps? pre-2001 stragglers? latest record date? (SF verified all three.)
- **Full yearly incident counts, 2001–2026** — SF has a complete year table with the COVID dip and right-censoring annotated; Chicago has only three recent months. A full table would also show the 2001–02 Community Area cliff in context and any reporting-regime shifts.
- **Geographic clustering of missing coordinates** — per–Community Area drop-rate logging (the findings PDF's own unresolved item).

---

## Open questions

1. **Arrest temporality** — frozen at filing or updated in place? Diff two pulls; read the portal FAQ. Blocks all cross-city outcome comparison.
2. **Primary-offense-only recording** — why is multi-code 0.006% here vs. routine in SF? Blocks cross-city offense-mix comparison.
3. **Systematic exclusions** — juvenile records, expunged records, other agencies (ISP expressways), confidential-filing analogs, portal disclaimers.
4. **Proactive-by-category inference** — validate against SF CAD ground truth, then adopt for Chicago and SF-historical?
5. **Cross-city crime taxonomy** — `Primary Type`/IUCR/`FBI Code` ↔ SF `Incident Category`: build a small LENS taxonomy both cities map into, or a direct crosswalk? Blocks every cross-city lens.
6. **Ward** — drop, or keep for an accountability lens?
7. **Population joins** — pull CA-level population for per-capita rates?

## Therefore (PROPOSED — ratify in team review)

- Deduplicate on `Case Number`; never count `ID`s as incidents.
- Drop the 5 arrest-conflict incidents from outcome analysis; log as ambiguous.
- `Community Area = 0` → null. Exclude or flag 2001–2002 in neighborhood-level lenses; district lenses unaffected.
- Out-of-Illinois coordinates: strip coords, keep the record, log. Missing coordinates: aggregate lenses only; log drops per Community Area.
- Flag the trailing 90 days as provisional in all time series.
- Retain `Updated On` until open question 1 is resolved.
- Pin one canonical snapshot per analysis cycle; record the pull date in this document.
- No cross-city outcome or offense-mix comparisons ship until open questions 1, 2, and 5 are resolved.
