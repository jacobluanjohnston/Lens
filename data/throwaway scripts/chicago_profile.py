import pandas as pd
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

DATASET = {
    "name": "Chicago Crimes (2001-present)",
    "path": SCRIPT_DIR.parent / "chicago" / "Crimes_-_2001_to_Present.csv",
}

WIDTH = 90

print(f'\n{"=" * WIDTH}')
print(f'Dataset: {DATASET["name"]}')
print(f'\n{"=" * WIDTH}')
print(f'Loading "{DATASET["path"]}"...\n')

df = pd.read_csv(DATASET["path"], low_memory=False)

print(f"{'Rows:':<{WIDTH - 10}} {df.shape[0]:>8,}")
print(f"{'Columns:':<{WIDTH - 10}} {df.shape[1]:>8}")

memory_mb = df.memory_usage(deep=True).sum() / (1024 ** 2)
print(f"{'Memory (MB):':<{WIDTH - 10}} {memory_mb:>8.2f}")

print(f"Rows: {len(df):,}")
print(f"Unique Case Numbers: {df['Case Number'].nunique():,}")

print(f'\n{"=" * WIDTH}')
print("Incident Consistency")
print("=" * WIDTH)

# One incident may have multiple offense codes (multiple rows)
arrests_per_incident = (
    df.groupby("Case Number")["Arrest"]
      .nunique()
)

incidents_with_multiple_codes = (
    df[df.duplicated("Case Number", keep=False)]["Case Number"]
      .unique()
)

arrest_varies = arrests_per_incident[arrests_per_incident > 1]

codes_per_incident = (
    df.groupby("Case Number")["Arrest"]
      .count()
)

multi_code_incidents = codes_per_incident[codes_per_incident > 1]

print(f"{'Total incidents:':<{WIDTH - 10}} {arrests_per_incident.shape[0]:>8,}")
print(f"{'Incidents with multiple codes:':<{WIDTH - 10}} {len(incidents_with_multiple_codes):>8,}")
print(f"{'Arrest varies across codes:':<{WIDTH - 10}} {arrest_varies.shape[0]:>8,}")

if not multi_code_incidents.empty:
    print(f"{'Max codes on one incident:':<{WIDTH - 10}} {multi_code_incidents.max():>8,}")
    print(f"{'Mean codes (multi-code only):':<{WIDTH - 10}} {multi_code_incidents.mean():>8.2f}")
else:
    print(f"{'Max codes on one incident:':<{WIDTH - 10}} {'0':>8}")
    print(f"{'Mean codes (multi-code only):':<{WIDTH - 10}} {'0.00':>8}")

if arrest_varies.empty:
    print("\nArrest status is consistent across all multi-code incidents.")
else:
    print("\nSample of incidents where Arrest differs:")
    print(arrest_varies.head(25))

print("\nColumns:")
for column in df.columns:
    print(f" - {column}")

print(f'\n{"=" * WIDTH}')
print("Missing Values")
print("=" * WIDTH)

missing = df.isnull().sum()
missing_percent = (missing / len(df)) * 100

for column in df.columns:
    if missing[column] > 0:
        print(
            f"{column:<30}"
            f"{missing[column]:>10,} "
            f"({missing_percent[column]:.2f}%)"
        )

print(f'\n{"=" * WIDTH}')
print("GPS Completeness")
print("=" * WIDTH)

missing_lat = df["Latitude"].isnull().sum()
missing_lon = df["Longitude"].isnull().sum()
missing_both = df[df["Latitude"].isnull() & df["Longitude"].isnull()].shape[0]

print(f"{'Missing Latitude:':<{WIDTH - 10}} {missing_lat:>8,}")
print(f"{'Missing Longitude:':<{WIDTH - 10}} {missing_lon:>8,}")
print(f"{'Missing Both:':<{WIDTH - 10}} {missing_both:>8,}")

print(f'\n{"=" * WIDTH}')
print("Community Area Missing by Year")
print("=" * WIDTH)

community_missing = (
    df.groupby("Year")["Community Area"]
      .apply(lambda x: x.isnull().mean() * 100)
)

for year, percent in community_missing.items():
    print(f"{int(year):<8} {percent:6.2f}%")

print(f'\n{"=" * WIDTH}')
print("GPS Missing by Year")
print("=" * WIDTH)

gps_missing = (
    df.groupby("Year")["Latitude"]
      .apply(lambda x: x.isnull().mean() * 100)
)

for year, percent in gps_missing.items():
    print(f"{int(year):<8} {percent:6.2f}%")

print(f'\n{"=" * WIDTH}')
print("Incidents by Year")
print("=" * WIDTH)

print(df["Year"].value_counts().sort_index())

print(f'\n{"=" * WIDTH}')
print("Duplicate Incident IDs")
print("=" * WIDTH)

duplicate_ids = df["ID"].duplicated().sum()

print(f"{'Duplicate IDs:':<{WIDTH - 10}} {duplicate_ids:>8,}")

print(f'\n{"=" * WIDTH}')
print("Arrest Distribution")
print("=" * WIDTH)

print(df["Arrest"].value_counts(dropna=False))