# Spike: Proactive / Reactive Incident Classifier

**Question:** Can we reliably classify SF incidents as officer-initiated (proactive) vs. victim-reported (reactive) using the fields available in the dataset, so that Lens 2 can measure enforcement intensity independently of crime category?

**Date:** 2026-07-05/06

---

## What we tried

The SF dataset has three fields that looked promising for classifying who initiated a report:

- `Filed Online` — TRUE means the victim filed via Coplogic (the online self-report portal), with no officer present. Unambiguously reactive.
- `CAD Number` — present when a 911 dispatch triggered the response. Officer responded to a call; victim is the gatekeeper of the record. Reactive.
- `Report Type Description = "Initial"` + no CAD + not filed online — the residual. Supposedly officer-initiated.

We cross-tabbed these fields against incident category for the full current dataset (2018–present, 745,746 cases).

## What we found

The inference collapsed before it helped. CAD coverage on the categories we cared most about — drug offenses, warrants, prostitution — was already 96–99%. Those categories are nearly universally CAD-linked even though they are definitionally officer-initiated (an officer dispatched to a scene still files the report; that CAD number doesn't mean a victim called). Filed Online was 100% equivalent to Coplogic report types — it added nothing beyond what the report type field already said.

The residual "proactive" bucket (no CAD, not filed online, Initial report) was 2.8% of cases and was dominated by administrative and ambiguous records, not the officer-initiated street enforcement we were trying to measure.

For pre-2018 (historical) data: `Report Type Description`, `Filed Online`, and `CAD Number` do not exist at all. The classifier would be impossible for half the dataset.

## Therefore

**The proactive/reactive classifier is closed as negative.** The signal we were trying to extract — which incidents exist only because an officer was present — is already captured more cleanly and more reliably by the incident category itself.

Drug offenses, warrants, and prostitution fail the station test by definition: if officers stayed in the station, these incidents produce no record. Burglary and robbery pass the station test: victims report them regardless. Category membership is the classifier. We replaced the field-inference approach with the category-defined Lens 2 (see `docs/adr/001_category_bucket_assignments.md`).
