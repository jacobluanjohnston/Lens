# LENS UI Language Decisions

> Tracks what copy changed, why, and what was deliberately kept. Separate from `methodology.md` (which covers measurement decisions) — this covers the words shown to users and the reasoning behind them.

---

## Lens 2 label

| Before | After |
|---|---|
| "Officer Enforcement" | "Police Stops vs. Crime Reports" |

**Why:** "Officer Enforcement" is internal shorthand. A journalist or oversight analyst seeing this label for the first time has no way to know what it measures. "Police Stops vs. Crime Reports" names both sides of the ratio — what's in the numerator and what's in the denominator — without requiring prior knowledge of the methodology.

---

## Lens 2 subtitle (LensPanel)

| Before | After |
|---|---|
| "Proactive stops per 100 victim-reported crimes" | "How much police-initiated activity vs. crimes reported by residents" |

**Why:** "Proactive" and "victim-reported" are methodology terms. "Police-initiated" and "crimes reported by residents" say the same thing in words a non-technical reader can parse without a glossary.

---

## Lens 2 description (NeighborhoodPanel — normal and compare modes)

| Before | After |
|---|---|
| "How much officer-initiated activity relative to victim-reported crime? Compares proactive incidents (drug stops, warrants, prostitution) to serious victim-reported crimes (burglary, robbery, assault, vehicle theft)." | "Compares police-initiated stops (drug stops, warrants, prostitution) to serious crimes reported by residents (burglary, robbery, assault, vehicle theft)." |

**Why:** Three banned phrases in one sentence ("officer-initiated", "victim-reported" × 2, "proactive"). The new version preserves the concrete examples (drug stops, warrants, prostitution / burglary, robbery, assault, vehicle theft) because those are useful and plain — it only replaces the jargon framing.

**Note:** Both the normal panel and compare panel now use identical description text. Previously they differed — normal panel had the long version, compare panel had a shorter inconsistent one-liner. Unified in Card 5.

---

## Lens 2 metric label (NeighborhoodPanel)

| Before | After |
|---|---|
| "Enforcement Ratio" | "Police Stops per Crime Report" |

**Why:** "Enforcement Ratio" is opaque — a ratio of what to what? "Police Stops per Crime Report" names both quantities and matches how the metric is actually described in the methodology.

---

## Geocoding failure flag (what text)

| Before | After |
|---|---|
| "High geocoding failure rate" | "Some incidents couldn't be placed on the map" |

**Why:** "Geocoding failure rate" is a technical term. The plain version says what actually happened — some incidents are missing from the map — without requiring the reader to know what geocoding is.

## Geocoding failure flag (why/explanation text)

| Before | After |
|---|---|
| "Many incidents here couldn't be placed on the map, so counts likely understate actual activity. The failure rate isn't random — it correlates with data-quality disparities across neighborhoods." | "Some incidents in this neighborhood have incomplete address information in the source data and can't be shown on the map. This means counts here may be understated — and this gap tends to affect some neighborhoods more than others." |

**Why:** The old text mentioned "failure rate" (still a technical framing) and "data-quality disparities" (abstract). The new text names the actual cause (incomplete address information), the consequence (understated counts), and the equity implication (uneven distribution across neighborhoods) — in plain language a journalist can quote directly.

---

## No-population flag

| Before | After |
|---|---|
| "No resident population" | "No residents — per-person figures not shown" |

**Why:** "No resident population" is accurate but abstract. The new version says both the fact (no residents) and the consequence (per-person figures are suppressed), so the reader understands why the number is missing rather than wondering if it's a data error.

---

## Lens 1 label

| Before | After |
|---|---|
| "Incidence" (lens title in LensPanel) | "Incidents" |
| "Lens 1 — Incidence" (LENS_META label in NeighborhoodPanel) | "Lens 1 — Incidents" |

**Why:** "Incidence" is epidemiological jargon. "Incidents" is the word we use everywhere else in the codebase and is unambiguous.

---

## Lens 1 sub-toggle button

| Before | After |
|---|---|
| "Per Capita" | "Per Resident" |

**Why:** "Per capita" is a Latin phrase most people recognize but few would use naturally. "Per resident" says the same thing in plain English. We kept it short (two words) to fit the toggle button without wrapping.

---

## Compare panel — empty state

| Before | After |
|---|---|
| "Click a neighborhood to compare its before and after enforcement ratios." | "Click a neighborhood to see how enforcement changed between the two periods." |

**Why:** "enforcement ratios" is unexplained jargon here. The plain version says what the user will see (a before/after comparison) without requiring them to know what the metric is called.

---

## Compare panel — metric labels

| Before | After |
|---|---|
| "Before ratio" | "Before" |
| "After ratio" | "After" |
| "Delta" | "Change" |

**Why:** "ratio" and "delta" are technical. The date range is already shown as secondary text inside each card, so "Before" and "After" are unambiguous without restating "ratio". "Change" replaces "Delta" (a math/stats term).

---

## Delta legend (compare mode choropleth)

| Before | After |
|---|---|
| "Change in enforcement ratio" | "Change in police stops vs. crime reports" |
| "No comparable ratio" | "No comparable data" |

**Why:** "enforcement ratio" is unexplained in the legend context. "police stops vs. crime reports" names what's actually being measured. "No comparable ratio" is cryptic; "No comparable data" says what the gray color means.

---

## Lens 2 description placement (NeighborhoodPanel — normal mode)

**Change:** The description text ("Compares police-initiated stops...") moved from *above* the metric value to *below* it.

**Why:** A user looking at the neighborhood panel should see the number first — that's the primary finding. The explanation of what the number means is supporting context, not the headline. In the old layout, three lines of explanation text blocked the reader from seeing the metric. In the new layout: name → metric value → what it means → city median comparison.

---

## What was NOT changed

**"Data flags"** — Card 5 originally proposed changing this to "Data warnings." Kept as "Data flags" because flags is a more precise term: a flag is a discrete, named annotation (provisional, low_confidence, per_capita_na), not just a generic warning. "Warning" implies something went wrong; "flag" implies something worth noting that the analyst should interpret.
