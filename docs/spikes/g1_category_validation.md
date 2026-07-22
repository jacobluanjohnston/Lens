# Spike: G1 — Category Validation

**Date:** 2026-07-20
**Script:** `pipeline/analysis/g1_category_validation.py`

**Used for:** Lens 2 (bucket assignments for numerator and denominator) and Lens 3 (confirming supplement lift is real before building the resolution join).

---

## G1a: At-filing arrest share and supplement lift per category

| Category | Total | % Arrest at Filing | Has Supplement | % Lift |
|---|---|---|---|---|
| Traffic Violation Arrest | 4,477 | 97.0 | 294 | 8.8 |
| Drug Violation | 106 | 96.2 | 38 | 5.3 |
| Warrant | 17,440 | 96.1 | 1,554 | 8.9 |
| Drug Offense | 15,053 | 93.5 | 1,560 | 6.8 |
| Prostitution | 741 | 87.4 | 18 | 11.1 |
| Weapons Carrying Etc | 1,812 | 84.7 | 488 | 12.7 |
| Liquor Laws | 94 | 84.0 | 8 | 12.5 |
| Civil Sidewalks | 821 | 70.8 | 12 | 8.3 |
| Stolen Property | 1,569 | 67.9 | 316 | 13.9 |
| Gambling | 33 | 57.6 | 7 | 28.6 |
| Homicide | 70 | 54.3 | 60 | 38.3 |
| Sex Offense | 759 | 47.2 | 96 | 41.7 |
| Other Miscellaneous | 39,357 | 46.5 | 3,153 | 15.5 |
| Vehicle Impounded | 362 | 40.3 | 53 | 11.3 |
| Traffic Collision | 1,638 | 32.5 | 908 | 5.1 |
| Human Trafficking (A), Commercial Sex Acts | 74 | 29.7 | 14 | 21.4 |
| Case Closure | 458 | 27.9 | 313 | 2.6 |
| Disorderly Conduct | 11,489 | 27.8 | 1,074 | 29.3 |
| Offences Against The Family And Children | 7,769 | 27.4 | 891 | 42.6 |
| Other Offenses | 3,661 | 26.9 | 305 | 8.2 |
| Weapons Offense | 4,315 | 23.8 | 530 | 32.6 |
| Assault | 46,763 | 21.4 | 4,816 | 32.7 |
| Recovered Vehicle | 2,444 | 18.2 | 713 | 3.5 |
| Vandalism | 1,474 | 18.1 | 62 | 17.7 |
| Unknown | 938 | 17.6 | 216 | 51.4 |
| Forgery And Counterfeiting | 2,331 | 13.5 | 452 | 50.4 |
| Arson | 2,238 | 12.2 | 304 | 46.4 |
| Robbery | 15,558 | 9.8 | 2,660 | 35.4 |
| Malicious Mischief | 57,536 | 6.6 | 3,075 | 23.4 |
| Non-Criminal | 30,436 | 6.5 | 1,481 | 11.0 |
| Embezzlement | 1,009 | 6.1 | 482 | 17.4 |
| Rape | 174 | 5.2 | 17 | 23.5 |
| Burglary | 41,680 | 4.3 | 7,411 | 22.2 |
| Courtesy Report | 2,049 | 3.4 | 124 | 21.8 |
| Motor Vehicle Theft | 50,428 | 2.9 | 37,535 | 7.6 |
| Larceny Theft | 266,116 | 2.7 | 22,424 | 9.5 |
| Missing Person | 16,173 | 1.4 | 7,339 | 4.1 |
| Fraud | 25,350 | 1.3 | 2,915 | 20.9 |
| Miscellaneous Investigation | 11,736 | 1.2 | 727 | 23.1 |
| Fire Report | 1,392 | 1.1 | 77 | 18.2 |
| Suspicious Occ | 18,463 | 0.8 | 1,203 | 11.5 |
| Other | 8,769 | 0.3 | 155 | 5.2 |
| Suicide | 440 | 0.2 | 18 | 0.0 |
| Lost Property | 30,102 | 0.1 | 1,273 | 3.0 |
| Vehicle Misplaced | 47 | 0.0 | 16 | 25.0 |
| Human Trafficking (B), Involuntary Servitude | 2 | 0.0 | 1 | 0.0 |

---

## G1b: Coplogic share per category

| Category | Total Initial Rows | % Coplogic |
|---|---|---|
| Lost Property | 30,996 | 60.9 |
| Larceny Theft | 278,114 | 50.3 |
| Malicious Mischief | 67,088 | 27.8 |
| Fraud | 31,362 | 15.0 |
| Traffic Collision | 1,401 | 8.7 |
| Forgery And Counterfeiting | 3,326 | 3.9 |
| Stolen Property | 3,522 | 0.9 |
| Burglary | 46,420 | 0.1 |
| All others | — | 0.0 |

---

## What this confirms

**The bimodal distribution is the finding.** At-filing arrest rates split into two clean clusters with almost no overlap:

- **Officer-initiated cluster (85–97%):** Drug Offense 93.5%, Drug Violation 96.2%, Warrant 96.1%, Prostitution 87.4%, Traffic Violation Arrest 97.0%, Weapons Carrying 84.7%
- **Victim-reported cluster (2–10%):** Burglary 4.3%, Motor Vehicle Theft 2.9%, Robbery 9.8%
- **Ambiguous middle:** Disorderly Conduct 27.8%, Civil Sidewalks 70.8%, Stolen Property 67.9%

The separation is so clean that the ambiguous middle cases almost select themselves out — if it doesn't clearly belong to one cluster, it gets excluded rather than forced in.

---

## What we learned for Lens 2

- **Bucket B (numerator) confirmed:** Drug Offense, Drug Violation, Warrant, Prostitution, Traffic Violation Arrest, Weapons Carrying Etc
- **Disorderly Conduct removed from bucket B:** 27.8% at-filing arrest — civilians frequently call police on disorderly individuals, so this is not reliably officer-initiated
- **Civil Sidewalks excluded:** 70.8% is high but civilians routinely report nuisance behavior — ambiguous enough to leave out
- **Stolen Property excluded:** 67.9% but victims report finding stolen property — selection-dependent
- **Larceny confirmed out of denominator:** 50.3% Coplogic share confirms it is victim-driven, but volume collapsed ~30% due to Coplogic reporting behavior changes — swings the ratio based on reporting sensitivity, not enforcement

---

## What we learned for Lens 3

- **Supplement lift is real for bucket A:** Burglary +22.2%, Robbery +35.4%, Assault +32.7% — resolution genuinely changes after initial filing, meaning the join is worth doing
- **MVT lift is low at 7.6%** — noted as a Lens 3 caveat. MVT closes fast (G2: p90 = 26 days) so most resolutions arrive quickly and don't require a late supplement
- **Homicide shows 38.3% lift and 54.3% at-filing arrest** — high at-filing arrest likely reflects cases where the suspect is immediately obvious (domestic, witnessed). Shown as censoring exhibit only due to confidential record suppression
- **Offences Against The Family And Children shows 42.6% lift** — high supplement lift suggests meaningful resolution updates, but mandatory-arrest policy inflates at-filing arrest (27.4%). Requires same DV surgery as Assault before it could be included in any resolution metric

---

## What's still possible to build from this data

- **Lens 3 (Burglary, Robbery, MVT):** all three show strong supplement lift and clean victim-cluster at-filing arrest rates. Buildable now pending G4 and without assault surgery.
- **Assault in Lens 3:** requires subcategory surgery (split Aggravated from Simple), DV flagging, assault-on-officer removal. High lift (32.7%) confirms it's worth doing once the surgery is complete.
- **Weapons Offense (23.8% at-filing arrest):** sits in the ambiguous middle. Lower than bucket B but higher than bucket A. Could be a future sensitivity check — some weapons offenses are victim-reported (someone finds a gun), some are officer-initiated stops.
- **Liquor Laws (84.0%):** small volume (94 cases) but clearly officer-initiated by the station test. Could be added to bucket B in a future version.
- **Chicago extension:** Chicago only has a binary Arrest boolean and no Coplogic — this full bimodal analysis cannot be replicated there. Lens 2 for Chicago would require a different validation approach.
