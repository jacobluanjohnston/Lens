# Chicago Dataset Profiling

## Purpose

Profile the Chicago Crimes (2001–Present) dataset to identify data quality
issues, understand the dataset schema, and document characteristics that may
affect the Lens ingestion pipeline and downstream analyses.

---

## Dataset Summary

**Source**

Chicago Crimes (2001–Present) https://data.cityofchicago.org/api/views/ijzp-q8t2/rows.csv?accessType=DOWNLOAD

**Rows (offense records)**

8,587,239

**Unique incidents (Case Numbers)**

8,586,614

**Columns**

22

**Approximate memory usage**

5851.63 MB

### Observation

Each row represents a recorded offense. Multiple rows may share the same
**Case Number**, indicating multiple offense codes associated with a single
police incident.

---

## Incident Consistency

Chicago does not include a Resolution field like the San Francisco dataset.
The closest equivalent is the **Arrest** field (True/False), which was used
to verify consistency across multi-code incidents.

| Metric | Value |
|---------|------:|
| Total incidents | 8,586,614 |
| Incidents with multiple codes | 521 |
| Arrest varies across codes | 5 |
| Maximum codes on one incident | 6 |
| Mean codes (multi-code incidents only) | 2.20 |

### Observation

Only **5 incidents** contain conflicting Arrest values across multiple offense
codes. This represents an extremely small fraction of the dataset and should
be documented as a potential data quality limitation.

---

## Schema Summary

The dataset contains 22 columns describing each offense record.

**Primary identifiers**

- ID
- Case Number

**Temporal**

- Date
- Updated On
- Year

**Crime classification**

- IUCR
- Primary Type
- Description
- FBI Code

**Location**

- Block
- Location Description
- Beat
- District
- Ward
- Community Area
- X Coordinate
- Y Coordinate
- Latitude
- Longitude
- Location

**Other**

- Arrest
- Domestic

---

## Missing Values

| Column | Missing | Percent |
|---------|---------:|--------:|
| Ward | 614,813 | 7.16% |
| Community Area | 613,724 | 7.15% |
| Latitude | 96,910 | 1.13% |
| Longitude | 96,910 | 1.13% |
| Location | 96,910 | 1.13% |
| X Coordinate | 96,910 | 1.13% |
| Y Coordinate | 96,910 | 1.13% |
| Location Description | 16,281 | 0.19% |
| District | 47 | <0.01% |

### Observation

Most missing values occur in geographic fields. Ward and Community Area are
the only attributes with substantial missingness.

---

## GPS Completeness

| Metric | Value |
|---------|------:|
| Missing Latitude | 96,910 |
| Missing Longitude | 96,910 |
| Missing Both | 96,910 |

### Observation

Every record missing latitude is also missing longitude, indicating complete
absence of spatial coordinates rather than partially missing GPS data.

---

## Community Area Missingness by Year

### Key Findings

- 2001: **98.69%**
- 2002: **27.24%**
- 2003–2026: generally below **0.1%**

### Observation

The majority of missing Community Area values originate from the earliest
years of the dataset rather than representing an ongoing data quality issue.

---

## GPS Missingness by Year

GPS completeness varies slightly over time but remains relatively stable after
the early years. Missing coordinate rates generally remain below 3–4% in all
years.

---

## Duplicate Incident IDs

Duplicate **ID** values: **0**

### Observation

The primary key appears unique across the dataset.

---

## Arrest Distribution

| Arrest | Count |
|---------|------:|
| False | 6,436,321 |
| True | 2,150,918 |

### Observation

Approximately three-quarters of offense records did not result in an arrest.

---

## Questions / Follow-up

- Why are Community Area and Ward largely missing in 2001–2002?
- Should the five incidents with inconsistent Arrest values be retained,
  corrected, or excluded?
- How should records without Community Area be handled during ingestion?
- Should records without GPS coordinates participate in spatial analyses, or
  only aggregate statistics?