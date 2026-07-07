# Chicago Dataset Profiling

## Purpose

Profile the Chicago Crimes (2001–Present) dataset to identify data quality
issues, understand the dataset schema, and document characteristics that may
affect the Lens ingestion pipeline and downstream analyses.

---

## Dataset Summary

**Source**

Chicago Crimes (2001–Present)  
https://data.cityofchicago.org/api/views/ijzp-q8t2/rows.csv?accessType=DOWNLOAD

**Rows (offense records)**

8,587,239

**Unique incidents (Case Numbers)**

8,586,614

**Columns**

22

**Approximate memory usage**

5851.63 MB

### Observation

Each row represents a recorded offense. Multiple rows may share the
**Case Number**, indicating multiple offense codes associated with a single
police incident.

---

## Incident Consistency

Chicago does not include a Resolution field like the San Francisco dataset.
The closest equivalent is the **Arrest** field (True/False), which was used
to verify consistency across multi-code incidents.

| Metric | Value |
|---------|------:|
| Total unique incidents | 8,586,614 |
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

## MoSCoW Prioritization

### Must Have

Required for ingestion and core Lens analyses.

- ID
- Case Number
- Date
- Primary Type
- Description
- Arrest
- District
- Latitude
- Longitude

### Should Have

Important contextual information that improves geographic and analytical
capabilities.

- Community Area
- Ward
- Domestic
- Location Description
- IUCR
- FBI Code

### Could Have

Potentially useful for future analysis, but not required for Sprint 1.

- Beat
- Block

### Won't Have (Sprint 1)

Fields that are redundant or metadata and will not be used during the initial
ingestion pipeline.

- Updated On
- X Coordinate
- Y Coordinate
- Location

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

## Missing Information and Dataset Limitations

Several characteristics of the Chicago dataset should be considered during
ingestion and downstream analysis.

- Chicago does not include a **Resolution** field like the San Francisco
  dataset. **Arrest (True/False)** is the closest available outcome measure.

- Chicago does not include a **CAD-equivalent** field, so victim-initiated
  reports cannot be distinguished from officer-initiated incidents.

- Approximately **7%** of records are missing **Community Area** and **Ward**
  values. This missingness is primarily temporal rather than geographic:
  Community Area is missing for roughly **98.69%** of records in 2001,
  **27.24%** in 2002, and becomes nearly complete after 2003.

- **76 records** contain an invalid **Community Area** value (0). These should
  be treated as missing rather than valid neighborhood identifiers.

- Approximately **1.13%** of records are missing GPS coordinates, preventing
  those records from participating in map-based analyses.

- A small number of coordinate pairs fall outside the geographic boundaries
  of Chicago. These records should be flagged or excluded during spatial
  analysis.

- The most recent months of data may be incomplete because reports and arrest
  information continue to be updated after publication. Recent records should
  be treated cautiously during temporal analyses, and July 2026 data should
  not be used for analysis until the dataset stabilizes.