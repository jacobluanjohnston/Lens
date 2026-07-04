import pandas as pd

df = pd.read_csv("../../data/sf/Police_Department_Incident_Reports__2018_to_Present.csv", low_memory=False)

num_unique_values = df.groupby("Incident ID")["Resolution"].nunique()
resolution_varies = num_unique_values[num_unique_values > 1]

print(f"Analyzing \"data/sf/Police_Department_Incident_Reports__2018_to_Present.csv\"...")
print(f"--------------------------------------------------------------------------------")
print(f"Total incidents:                                            {num_unique_values.shape[0]}")
print(f"Incidents with multiple codes:                              {(num_unique_values.index.isin(df[df.duplicated(
    'Incident ID', keep=False)]['Incident ID'])).sum()}")
print(f"Incidents where Resolution outcome varies across codes:     {resolution_varies.shape[0]}")
print(f"--------------------------------------------------------------------------------")
print(f"\nSampling \"data/sf/Police_Department_Incident_Reports__2018_to_Present.csv\"...")
print(resolution_varies.head(50))
print(f"None found!")