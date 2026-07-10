import pandas as pd

DATASETS = [
    {
        "name": "Current (2018-present)",
        "path": "data/sf/Police_Department_Incident_Reports__2018_to_Present.csv",
        "datetime_col": "Incident Datetime",
        "report_datetime_col": "Report Datetime",
        "neighborhood_col": "Analysis Neighborhood",
        "lat_col": "Latitude",
        "lon_col": "Longitude",
        "category_col": "Incident Category",
        "district_col": "Police District",
        "resolution_col": "Resolution",
    },
    {
        "name": "Historical (2003-2017)",
        "path": "data/sf/Police_Department_Incident_Reports__Historical_2003_to_May_2018.csv",
        "datetime_col": "Date",
        "report_datetime_col": None,
        "neighborhood_col": "Analysis Neighborhoods 2 2",
        "lat_col": "Y",
        "lon_col": "X",
        "category_col": "Category",
        "district_col": "PdDistrict",
        "resolution_col": "Resolution",
    },
]

WIDTH = 90

for ds in DATASETS:
    print(f'\n{"=" * WIDTH}')
    print(f'Dataset: {ds["name"]}')
    print(f'{"=" * WIDTH}')
    print(f'Loading "{ds["path"]}"...\n')

    df = pd.read_csv(ds["path"], low_memory=False)
    df[ds["datetime_col"]] = pd.to_datetime(df[ds["datetime_col"]], format="mixed")

    # ── Null rates per column ──────────────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print("Null rates per column (only columns with missing values)")
    print(f'{"─" * WIDTH}')
    null_rates = (df.isnull().sum() / len(df) * 100).sort_values(ascending=False)
    for col, rate in null_rates.items():
        if rate > 0:
            print(f"  {col:<60} {rate:>6.2f}%")

    # ── Coordinate validation ──────────────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print("Coordinate validation")
    print(f'{"─" * WIDTH}')
    lat, lon = ds["lat_col"], ds["lon_col"]
    null_lat = df[lat].isnull().sum()
    null_lon = df[lon].isnull().sum()
    null_island = ((df[lat] == 0) & (df[lon] == 0)).sum()
    print(f"  {'Null latitude:':<60} {null_lat:>8,} ({null_lat / len(df) * 100:.2f}%)")
    print(f"  {'Null longitude:':<60} {null_lon:>8,} ({null_lon / len(df) * 100:.2f}%)")
    print(f"  {'Null island (0, 0):':<60} {null_island:>8,}")

    # ── Neighborhood completeness ──────────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print("Neighborhood completeness")
    print(f'{"─" * WIDTH}')
    hood_col = ds["neighborhood_col"]
    if hood_col in df.columns:
        has_hood = df[hood_col].notnull().sum()
        missing_hood = df[hood_col].isnull().sum()
        print(f"  {'Has neighborhood assigned:':<60} {has_hood:>8,} ({has_hood / len(df) * 100:.2f}%)")
        print(f"  {'Missing neighborhood:':<60} {missing_hood:>8,} ({missing_hood / len(df) * 100:.2f}%)")
    else:
        print(f"  Column '{hood_col}' not found — check column name.")

    # ── Date range sanity ──────────────────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print("Date range sanity")
    print(f'{"─" * WIDTH}')
    print(f"  {'Earliest incident:':<60} {df[ds['datetime_col']].min()}")
    print(f"  {'Latest incident:':<60} {df[ds['datetime_col']].max()}")
    future = (df[ds["datetime_col"]] > pd.Timestamp.now()).sum()
    print(f"  {'Timestamps in the future:':<60} {future:>8,}")

    # ── Incident count by year ─────────────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print("Incident count by year")
    print(f'{"─" * WIDTH}')
    by_year = df[ds["datetime_col"]].dt.year.value_counts().sort_index()
    for year, count in by_year.items():
        print(f"  {year}:  {count:>8,}")

    # ── Resolution value distribution ──────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print("Resolution value distribution")
    print(f'{"─" * WIDTH}')
    res_counts = df[ds["resolution_col"]].value_counts(dropna=False)
    for value, count in res_counts.items():
        print(f"  {str(value):<50} {count:>8,} ({count / len(df) * 100:.2f}%)")

    # ── Incident category distribution ────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print(f'Incident category distribution ({ds["category_col"]})')
    print(f'{"─" * WIDTH}')
    cat_counts = df[ds["category_col"]].value_counts(dropna=False)
    for value, count in cat_counts.items():
        print(f"  {str(value):<50} {count:>8,} ({count / len(df) * 100:.2f}%)")

    # ── Police district distribution ──────────────────────────────────────────
    print(f'\n{"─" * WIDTH}')
    print(f'Police district distribution ({ds["district_col"]})')
    print(f'{"─" * WIDTH}')
    dist_counts = df[ds["district_col"]].value_counts(dropna=False)
    for value, count in dist_counts.items():
        print(f"  {str(value):<50} {count:>8,} ({count / len(df) * 100:.2f}%)")
