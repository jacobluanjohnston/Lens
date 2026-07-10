import pandas as pd

# Current dataset only — historical has no CAD Number, Filed Online, or Report Type fields.
PATH = "data/sf/Police_Department_Incident_Reports__2018_to_Present.csv"

print(f'Loading "{PATH}"...\n')
df = pd.read_csv(PATH, low_memory=False)
df["Incident Datetime"] = pd.to_datetime(df["Incident Datetime"], format="mixed")
df["Report Datetime"] = pd.to_datetime(df["Report Datetime"], format="mixed")

WIDTH = 90

# ── CAD Number presence by incident category ───────────────────────────────────
# Low % with CAD = officer-initiated (no 911 dispatch)
# High % with CAD = citizen-reported (911 dispatched)
print(f'\n{"=" * WIDTH}')
print("CAD Number presence by incident category")
print("(low % = likely officer-initiated, high % = likely citizen-reported)")
print(f'{"=" * WIDTH}')
cad_by_category = (
    df.groupby("Incident Category")["CAD Number"]
    .apply(lambda x: x.notnull().mean() * 100)
    .sort_values()
    .rename("% with CAD number")
)
for category, pct in cad_by_category.items():
    print(f"  {category:<50} {pct:>6.2f}%")

# ── Report Type Description distribution ──────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("Report Type Description distribution")
print(f'{"=" * WIDTH}')
report_type_counts = df["Report Type Description"].value_counts()
for report_type, count in report_type_counts.items():
    print(f"  {str(report_type):<50} {count:>8,} ({count / len(df) * 100:.2f}%)")

# ── Filed Online distribution ──────────────────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("Filed Online distribution")
print(f'{"=" * WIDTH}')
filed_online_counts = df["Filed Online"].value_counts(dropna=False)
for value, count in filed_online_counts.items():
    print(f"  {str(value):<50} {count:>8,} ({count / len(df) * 100:.2f}%)")

# ── Cross-tab Filed Online vs Report Type Description ─────────────────────────
print(f'\n{"=" * WIDTH}')
print("Cross-tab: Filed Online vs Report Type Description")
print(f'{"=" * WIDTH}')
print(pd.crosstab(df["Filed Online"], df["Report Type Description"], margins=True))

# ── Report lag distribution ────────────────────────────────────────────────────
# How long between when an incident happened and when the report was filed?
# Confirms right-censoring is real and shows how far back it reaches.
print(f'\n{"=" * WIDTH}')
print("Report lag distribution (Report Datetime - Incident Datetime)")
print(f'{"=" * WIDTH}')
df["report_lag_days"] = (df["Report Datetime"] - df["Incident Datetime"]).dt.total_seconds() / 86400
lag = df["report_lag_days"].dropna()
print(f"  {'Median lag (days):':<50} {lag.median():>8.1f}")
print(f"  {'Mean lag (days):':<50} {lag.mean():>8.1f}")
print(f"  {'90th percentile (days):':<50} {lag.quantile(0.90):>8.1f}")
print(f"  {'99th percentile (days):':<50} {lag.quantile(0.99):>8.1f}")
print(f"  {'Max lag (days):':<50} {lag.max():>8.1f}")
negative_lag = (lag < 0).sum()
print(f"  {'Negative lag (report before incident):':<50} {negative_lag:>8,} ({negative_lag / len(lag) * 100:.2f}%)")

# ── Right-censoring check: resolution rate by month ───────────────────────────
# Recent months should show artificially low resolution rates (cases not yet closed).
# A sharp drop in the last few months confirms right-censoring.
print(f'\n{"=" * WIDTH}')
print("Resolution rate by month (last 24 months)")
print("(sharp drop in recent months = right-censoring confirmed)")
print(f'{"=" * WIDTH}')
df["year_month"] = df["Incident Datetime"].dt.to_period("M")
resolved_values = {"Cite or Arrest Adult", "Exceptional Adult"}
df["is_resolved"] = df["Resolution"].isin(resolved_values)
monthly = (
    df.groupby("year_month")["is_resolved"]
    .agg(total="count", resolved="sum")
    .assign(resolution_rate=lambda x: x["resolved"] / x["total"] * 100)
    .sort_index()
    .tail(24)
)
for period, row in monthly.iterrows():
    print(f"  {str(period):<12} {row['resolution_rate']:>6.1f}%  ({int(row['resolved']):,} / {int(row['total']):,})")

# ── No-CAD residual bucket ────────────────────────────────────────────────────
# No CAD + not Coplogic = ambiguous officer-initiated-or-walk-in bucket.
# Shows how large and how meaningful this group actually is.
print(f'\n{"=" * WIDTH}')
print("No-CAD residual bucket (no CAD number, not a Coplogic report)")
print(f'{"=" * WIDTH}')
is_coplogic = df["Report Type Description"].str.contains("Coplogic", na=False)
no_cad = df["CAD Number"].isnull()
residual = df[no_cad & ~is_coplogic]
print(f"  {'Total rows:':<55} {len(df):>8,}")
print(f"  {'No CAD:':<55} {no_cad.sum():>8,} ({no_cad.sum() / len(df) * 100:.1f}%)")
print(f"  {'No CAD and not Coplogic (ambiguous bucket):':<55} {len(residual):>8,} ({len(residual) / len(df) * 100:.1f}%)")
print()
print("  Top incident categories in the ambiguous bucket:")
residual_cats = residual["Incident Category"].value_counts().head(15)
for cat, count in residual_cats.items():
    pct_of_residual = count / len(residual) * 100
    pct_of_category = count / df[df["Incident Category"] == cat].shape[0] * 100
    print(f"    {cat:<45} {count:>7,}  ({pct_of_residual:.1f}% of bucket, {pct_of_category:.1f}% of category)")

# ── Resolution trend: Initial reports only ────────────────────────────────────
# Re-run resolution rate by month using ONLY Initial report rows (no supplements).
# If the upward trend disappears → artifact from supplements accumulating over time.
# If the trend stays → real policy/enforcement change.
print(f'\n{"=" * WIDTH}')
print("Resolution rate by month — INITIAL REPORTS ONLY (last 24 months)")
print("(if trend flattens vs. all-rows above → supplement artifact confirmed)")
print(f'{"=" * WIDTH}')
initial_only = df[df["Report Type Description"] == "Initial"]
monthly_initial = (
    initial_only.groupby("year_month")["is_resolved"]
    .agg(total="count", resolved="sum")
    .assign(resolution_rate=lambda x: x["resolved"] / x["total"] * 100)
    .sort_index()
    .tail(24)
)
for period, row in monthly_initial.iterrows():
    print(f"  {str(period):<12} {row['resolution_rate']:>6.1f}%  ({int(row['resolved']):,} / {int(row['total']):,})")

# ── Do supplementals change resolution? ───────────────────────────────────────
# For incidents that have both an Initial and a Supplement row, compare Resolution.
# If supplements frequently differ → joining is necessary for accurate resolution lens.
# If supplements mostly match → initial-only is defensible.
print(f'\n{"=" * WIDTH}')
print("Do supplemental reports change resolution?")
print(f'{"=" * WIDTH}')
initial_res = (
    df[df["Report Type Description"] == "Initial"]
    .groupby("Incident ID")["Resolution"]
    .first()
    .rename("initial_resolution")
)
supplement_res = (
    df[df["Report Type Description"].str.contains("Supplement", na=False)]
    .groupby("Incident ID")["Resolution"]
    .last()
    .rename("supplement_resolution")
)
joined = initial_res.to_frame().join(supplement_res, how="inner")
total_with_supplement = len(joined)
changed = (joined["initial_resolution"] != joined["supplement_resolution"]).sum()
unchanged = total_with_supplement - changed
print(f"  {'Incidents with both Initial and Supplement:':<55} {total_with_supplement:>8,}")
print(f"  {'Resolution unchanged in supplement:':<55} {unchanged:>8,} ({unchanged / total_with_supplement * 100:.1f}%)")
print(f"  {'Resolution changed in supplement:':<55} {changed:>8,} ({changed / total_with_supplement * 100:.1f}%)")
print()
print("  Resolution changes (initial → supplement):")
change_breakdown = (
    joined[joined["initial_resolution"] != joined["supplement_resolution"]]
    .groupby(["initial_resolution", "supplement_resolution"])
    .size()
    .sort_values(ascending=False)
)
for (initial, supplement), count in change_breakdown.items():
    print(f"    {initial:<35} → {supplement:<35} {count:>8,}")

# ── Show sample supplement rows ───────────────────────────────────────────────
print(f'\n{"=" * WIDTH}')
print("Sample supplement rows — all fields")
print(f'{"=" * WIDTH}')
supps_sample = df[df["Report Type Description"].str.contains("Supplement", na=False)].head(5)
for i, row in supps_sample.iterrows():
    print(f"\n  --- Row {i} ---")
    for col in df.columns:
        val = row[col]
        if pd.notnull(val) and str(val).strip() != "":
            print(f"    {col:<50} {val}")

# ── Find the linking field between Initial and Supplement rows ────────────────
# Incident ID is confirmed unique per report — supplements have their own ID.
# Check all column names, then test CAD Number as the most likely link.
print(f'\n{"=" * WIDTH}')
print("Finding the link between Initial and Supplement rows")
print(f'{"=" * WIDTH}')

print("\n  All columns in dataset:")
for col in df.columns:
    print(f"    {col}")

# Check if CAD Number links initial to supplement
print("\n  Supplements WITH a CAD number:")
supps = df[df["Report Type Description"].str.contains("Supplement", na=False)]
supps_with_cad = supps[supps["CAD Number"].notnull()]
print(f"    {len(supps_with_cad):,} of {len(supps):,} supplement rows have a CAD number ({len(supps_with_cad)/len(supps)*100:.1f}%)")

# For supplements that have a CAD number, find Initial rows with the same CAD number
if len(supps_with_cad) > 0:
    sample_cad = supps_with_cad["CAD Number"].iloc[0]
    print(f"\n  Sample supplement CAD Number: {sample_cad}")
    cad_matches = df[df["CAD Number"] == sample_cad]
    print(f"  All rows sharing that CAD Number:")
    print(cad_matches[["Incident ID", "Report Type Description", "Resolution", "Incident Datetime"]].to_string())

# How many supplements share a CAD number with at least one Initial row?
initial_cads = set(df[df["Report Type Description"] == "Initial"]["CAD Number"].dropna())
supps_linked_by_cad = supps_with_cad[supps_with_cad["CAD Number"].isin(initial_cads)]
print(f"\n  Supplements linkable to an Initial via CAD Number: {len(supps_linked_by_cad):,} of {len(supps):,} ({len(supps_linked_by_cad)/len(supps)*100:.1f}%)")

# ── Test Incident Number as the linking field ──────────────────────────────────
# Incident Number is different from Incident ID — test if supplements share
# Incident Number with their corresponding Initial row.
print(f'\n{"=" * WIDTH}')
print("Test: does Incident Number link supplements to Initial rows?")
print(f'{"=" * WIDTH}')

# For the CAD-confirmed pair, check if they share Incident Number
cad_confirmed_supp = df[(df["Incident ID"] == 1489372)]
cad_confirmed_init = df[(df["Incident ID"] == 1466530)]
print(f"\n  CAD-confirmed pair:")
print(f"    Supplement Incident Number: {cad_confirmed_supp['Incident Number'].values[0]}")
print(f"    Initial    Incident Number: {cad_confirmed_init['Incident Number'].values[0]}")

# Try joining supplements to initials on Incident Number
initial_types = {"Initial", "Coplogic Initial", "Vehicle Initial"}
initial_by_inc_num = (
    df[df["Report Type Description"].isin(initial_types)]
    .groupby("Incident Number")["Resolution"]
    .first()
    .rename("initial_resolution")
)
supp_by_inc_num = (
    df[df["Report Type Description"].str.contains("Supplement", na=False)]
    .groupby("Incident Number")["Resolution"]
    .last()
    .rename("supplement_resolution")
)
joined_by_inc_num = initial_by_inc_num.to_frame().join(supp_by_inc_num, how="inner")
print(f"\n  Supplements joinable to Initial via Incident Number: {len(joined_by_inc_num):,} of {len(supps):,} ({len(joined_by_inc_num)/len(supps)*100:.1f}%)")
if len(joined_by_inc_num) > 0:
    changed = (joined_by_inc_num["initial_resolution"] != joined_by_inc_num["supplement_resolution"]).sum()
    print(f"  Of those, resolution changed in supplement: {changed:,} ({changed/len(joined_by_inc_num)*100:.1f}%)")

# ── Where are the unlinked supplements? ───────────────────────────────────────
# 36.4% of supplements couldn't be joined to any initial in the current dataset.
# Hypothesis: their initial reports are in the historical (pre-2018) dataset.
# Verify by checking the incident datetime of unlinked supplements.
print(f'\n{"=" * WIDTH}')
print("Where are the unlinked supplements? (testing pre-2018 hypothesis)")
print(f'{"=" * WIDTH}')

HISTORICAL_PATH = "data/sf/Police_Department_Incident_Reports__Historical_2003_to_May_2018.csv"
print(f'  Loading historical dataset...')
hist = pd.read_csv(HISTORICAL_PATH, low_memory=False)

# Get Incident Numbers from all initials in BOTH datasets
hist_inc_nums = set(hist["IncidntNum"].dropna().astype(str))
current_inc_nums = set(
    df[df["Report Type Description"].isin(initial_types)]["Incident Number"]
    .dropna().astype(str)
)

# Find the unlinked supplement Incident Numbers
all_supp_inc_nums = (
    df[df["Report Type Description"].str.contains("Supplement", na=False)]["Incident Number"]
    .dropna().astype(str)
)
unlinked = all_supp_inc_nums[~all_supp_inc_nums.isin(current_inc_nums)]

in_historical = unlinked.isin(hist_inc_nums).sum()
in_neither    = (~unlinked.isin(hist_inc_nums)).sum()

print(f"  Unlinked supplements:                          {len(unlinked):>8,}")
print(f"  Whose Incident Number IS in historical:        {in_historical:>8,} ({in_historical/len(unlinked)*100:.1f}%)")
print(f"  Whose Incident Number is in NEITHER dataset:   {in_neither:>8,} ({in_neither/len(unlinked)*100:.1f}%)")
