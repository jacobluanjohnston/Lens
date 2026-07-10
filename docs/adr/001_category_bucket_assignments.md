# ADR 001 — Category Bucket Assignments: Station Test over Field Inference

**Status:** Accepted  
**Date:** 2026-07-06  
**G1 validated:** 2026-07-08  
**Informed by:** `docs/spikes/proactive_reactive_classifier.md`

---

## Context

Lens 2 measures enforcement concentration: how much officer-initiated activity is happening in a neighborhood relative to victim-reported serious crime. To build this lens we need to classify every incident category as either officer-initiated or victim-reported.

Two approaches were on the table:

**Option A — Field inference:** classify incidents row-by-row using `CAD Number`, `Filed Online`, and `Report Type Description`. An incident with no CAD and not filed online would be called officer-initiated.

**Option B — Category membership (station test):** assign each incident *category* to a bucket once, based on whether incidents of that type could exist in the data without an officer being present. If officers stayed in the station for a month, would this category's counts drop to zero? If yes, it's officer-initiated.

## Decision

**We use Option B — category membership defined by the station test.**

The proactive/reactive classifier spike (see link above) showed that Option A does not work: CAD coverage on drug/warrant/prostitution — the categories we most needed to call officer-initiated — was 96–99%, making the field a near-constant for those categories rather than a discriminator. The residual "no CAD, not filed online" bucket was 2.8% of cases and contained mostly administrative records. Additionally, `CAD Number`, `Filed Online`, and `Report Type Description` do not exist in the pre-2018 historical dataset, making Option A impossible for half the data.

Option B is also the more honest approach. The station test is a conceptual definition, not a data artifact — it survives schema changes, applies to both datasets, and produces stable category assignments that can be documented and defended.

## Category assignments

**Bucket A — resolution-eligible (victim-reported serious crime):**  
Burglary, Robbery, Aggravated Assault, Motor Vehicle Theft.  
These are the Lens 3 denominator and the Lens 2 denominator.

**Bucket B — officer-initiated (Lens 2 numerator):**  
- *Confirmed core:* Drug Offense (93.5% at-filing arrest, 0% Coplogic), Drug Violation (96.2%, 0%), Warrant (96.1%, 0%), Prostitution (87.4%, 0%), Traffic Violation Arrest (97.0%, 0%), Weapons Carrying (84.7%, 0%)
- *Lower confidence — included with caveat:* Civil Sidewalks (70.8% at-filing arrest — lower than ideal but 0% Coplogic; civilians can report nuisance behaviour), Stolen Property (67.9%, 0.9% Coplogic — victim-findable property; selection-dependent as noted in STATUS.md)
- *Removed from broad:* Disorderly Conduct — only 27.8% at-filing arrest, indicating civilians frequently call police on disorderly individuals rather than officers discovering this themselves. Not officer-initiated enough to include.

Default to confirmed core only for v1. Civil Sidewalks and Stolen Property run as sensitivity. Disorderly Conduct excluded.

**Bucket C — censored, no rates:**  
Homicide, Rape, Sex Offense, Human Trafficking, Offences Against Family and Children.  
Systematically undercounted due to legal withholding. Shown as a censoring exhibit only — visible counts vs. official figures. No rates at any grain.

**Bucket D — victim harm, counted but not resolution-scored:**  
Larceny Theft, Vandalism, Fraud/Forgery/Embezzlement, Arson, Missing Person.  
Clearance floors near zero or cross-jurisdictional — resolution metrics are not meaningful.

**Bucket E — administrative, excluded from all numerators and denominators:**  
Recovered Vehicle, Case Closure, Non-Criminal, Lost Property, Courtesy Report, Suspicious Occ.

**Assault surgery (required before Lens 3):**  
Split Aggravated Assault from Simple Assault via subcategory field. Flag domestic violence incidents separately (mandatory-arrest policy inflates at-filing arrest rate for non-investigative reasons). Remove assault-on-officer rows (fail the station test — those are officer-initiated).

**Larceny excluded from Lens 2 denominator:**  
Larceny Theft has a ~30% volume collapse 2023–2025 driven by Coplogic reporting sensitivity, not a real change in theft. G1 confirmed this: 50.3% of larceny initial reports are Coplogic-filed — half of all larceny reports come from victims self-reporting online. Including larceny in the denominator would swing Lens 2 ratios by neighbourhood reporting behaviour, not enforcement behaviour. Larceny runs as a sensitivity check only.

## Consequences

- Lens 2 is stable across both dataset eras (pre/post 2018).
- Category assignments are a design choice that must be documented and defended — they are published in `docs/methodology.md` and the UI carries an "excluded categories and why" panel so omissions read as rigor, not bugs.
- G1 ran 2026-07-08. Confirmed core bucket B categories. Disorderly Conduct removed. Civil Sidewalks and Stolen Property demoted to sensitivity-only. Larceny exclusion confirmed by 50.3% Coplogic share. Supplement lift confirmed for bucket A (Burglary +22%, Robbery +35%, Assault +33%), validating the Lens 3 join approach. MVT lift is low (7.6%) — noted as a Lens 3 caveat.
- Lens 2 is buildable. Lens 3 requires assault surgery and window-N selection (G2) before build.
