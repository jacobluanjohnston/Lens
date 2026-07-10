import pandas as pd

DATASETS = [
    {
        "name": "Current (2018-present)",
        "path": "data/sf/Police_Department_Incident_Reports__2018_to_Present.csv",
        "incident_id": "Incident ID",
        "resolution": "Resolution",
    },
    {
        "name": "Historical (2003-2017)",
        "path": "data/sf/Police_Department_Incident_Reports__Historical_2003_to_May_2018.csv",
        "incident_id": "IncidntNum",
        "resolution": "Resolution",
    },
]

WIDTH = 90

for ds in DATASETS:
    print(f'\n{"=" * WIDTH}')
    print(f'Dataset: {ds["name"]}')
    print(f'\n{"=" * WIDTH}')
    print(f'Loading "{ds["path"]}"...\n')

    df = pd.read_csv(ds["path"], low_memory=False)

    resolutions_per_incident = df.groupby(ds["incident_id"])[ds["resolution"]].nunique()
    incidents_with_multiple_codes = df[df.duplicated(ds["incident_id"], keep=False)][ds["incident_id"]].unique()
    resolution_varies = resolutions_per_incident[resolutions_per_incident > 1]

    codes_per_incident = df.groupby(ds["incident_id"])[ds["resolution"]].count()
    multi_code_incidents = codes_per_incident[codes_per_incident > 1]

    print(f"{'Total incidents:':<{WIDTH - 10}} {resolutions_per_incident.shape[0]:>8,}")
    print(f"{'Incidents with multiple codes:':<{WIDTH - 10}} {len(incidents_with_multiple_codes):>8,}")
    print(f"{'Resolution varies across codes:':<{WIDTH - 10}} {resolution_varies.shape[0]:>8,}")
    print(f"{'Max codes on one incident:':<{WIDTH - 10}} {multi_code_incidents.max():>8,}")
    print(f"{'Mean codes (multi-code only):':<{WIDTH - 10}} {multi_code_incidents.mean():>8.2f}")

    if resolution_varies.empty:
        print("\nResolution is consistent across all multi-code incidents.")
    else:
        print("\nSample of inconsistent incidents:")
        print(resolution_varies.head(50))