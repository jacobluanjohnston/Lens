"""SF current-dataset ingestion adapter (2018-present).

Usage:
    python -m pipeline.adapters.sf.ingest \
        --csv  data/sf/Police_Department_Incident_Reports__2018_to_Present.csv \
        --db   postgresql://lens:lens@localhost:5432/lens

Reads the local CSV snapshot, normalises categories and resolution values,
bulk-loads raw_reports via COPY (seconds, not hours), then derives the
incidents table with a single INSERT…SELECT using window functions.

All dropped/null rows are counted and logged — never silently discarded.
Dropped rows remain in raw_reports; filtering is the API layer's responsibility.
"""

import argparse
import io
import logging
import os
from datetime import date

import pandas as pd
import psycopg2

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

# ── SF CSV → DB column mapping ────────────────────────────────────────────────

_CSV_RENAME = {
    "Row ID":                  "row_id",
    "Incident Number":         "incident_number",
    "Incident ID":             "incident_id",
    "Report Type Description": "report_type",
    "Incident Code":           "incident_code",
    "Incident Category":       "category_raw",
    "Incident Subcategory":    "subcategory",
    "Incident Description":    "description",
    "Resolution":              "resolution_raw",
    "Incident Datetime":       "occurred_at",
    "Report Datetime":         "reported_at",
    "Latitude":                "lat",
    "Longitude":               "lon",
    "Analysis Neighborhood":   "neighborhood",
    "Police District":         "district",
    "CAD Number":              "cad_number",
}

# Exact column order matching the raw_reports INSERT target
_DB_COLS = [
    "row_id", "incident_number", "incident_id", "report_type",
    "incident_code", "category_raw", "category", "subcategory", "description",
    "resolution_raw", "resolution", "occurred_at", "reported_at",
    "lat", "lon", "neighborhood", "district", "cad_number",
    "city", "dataset", "snapshot_date",
]

# ── Dirty-values normalisation ────────────────────────────────────────────────
# These are empirically confirmed typos/variants in the DataSF export.

_CATEGORY_FIXES = {
    "Weapons Offence":                          "Weapons Offense",
    "Motor Vehicle Theft?":                     "Motor Vehicle Theft",
    "Suspicious":                               "Suspicious Occ",
    "Human Trafficking, Commercial Sex Acts":   "Human Trafficking (A), Commercial Sex Acts",
}

# ── Resolution → unified enum ─────────────────────────────────────────────────

_RESOLUTION_MAP = {
    "Open or Active":          "open",
    "Cite or Arrest Adult":    "arrest_cite",
    "Cite or Arrest Juvenile": "arrest_cite",
    "Exceptional Adult":       "exceptional",
    "Exceptional Juvenile":    "exceptional",
    "Unfounded":               "unfounded",
}


def _norm_category(val: object) -> str:
    if pd.isna(val) or str(val).strip() == "":
        return "Unknown"
    s = str(val).strip()
    return _CATEGORY_FIXES.get(s, s)


def _norm_resolution(val: object) -> str:
    if pd.isna(val) or str(val).strip() == "":
        return "open"
    return _RESOLUTION_MAP.get(str(val).strip(), "other_historical")


# ── incidents derivation SQL ──────────────────────────────────────────────────
# Window functions pick first/last report by reported_at (never file order).
# DISTINCT ON in init_row picks the earliest non-supplement row for
# coords/category; falls back to earliest supplement for orphan-supplement cases.

_INCIDENTS_SQL = """
WITH per_report AS (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY incident_number
            ORDER BY reported_at ASC NULLS LAST
        ) AS rn_asc,
        ROW_NUMBER() OVER (
            PARTITION BY incident_number
            ORDER BY reported_at DESC NULLS LAST
        ) AS rn_desc
    FROM raw_reports
    WHERE city = %(city)s AND dataset = %(dataset)s
),
init_row AS (
    SELECT DISTINCT ON (incident_number)
        incident_number,
        category   AS category_primary,
        lat, lon, neighborhood, district
    FROM raw_reports
    WHERE city = %(city)s AND dataset = %(dataset)s
    ORDER BY
        incident_number,
        (report_type NOT ILIKE '%%Supplement%%') DESC,
        reported_at ASC NULLS LAST
),
agg AS (
    SELECT
        incident_number,
        city,
        MIN(occurred_at)                                       AS occurred_at,
        COUNT(DISTINCT incident_code)::int                     AS n_codes,
        COUNT(*)::int                                          AS n_reports,
        MAX(CASE WHEN rn_asc  = 1 THEN resolution::text END)   AS res_initial,
        MAX(CASE WHEN rn_desc = 1 THEN resolution::text END)   AS res_latest,
        BOOL_OR(report_type ILIKE '%%Supplement%%')            AS has_supplement,
        NOT BOOL_OR(report_type NOT ILIKE '%%Supplement%%')    AS orphan_supplement_only
    FROM per_report
    GROUP BY incident_number, city
)
INSERT INTO incidents (
    incident_number, city, occurred_at, category_primary,
    n_codes, n_reports,
    resolution_initial, resolution_latest, resolution_changed,
    has_supplement, lat, lon, neighborhood, district,
    orphan_supplement_only
)
SELECT
    a.incident_number,
    a.city,
    a.occurred_at,
    ir.category_primary,
    a.n_codes,
    a.n_reports,
    a.res_initial::resolution_status,
    a.res_latest::resolution_status,
    (a.res_initial IS DISTINCT FROM a.res_latest)  AS resolution_changed,
    a.has_supplement,
    ir.lat,
    ir.lon,
    ir.neighborhood,
    ir.district,
    a.orphan_supplement_only
FROM agg a
JOIN init_row ir USING (incident_number)
ON CONFLICT (incident_number) DO NOTHING
"""


def run(csv_path: str, db_url: str, snapshot_date: date | None = None) -> None:
    """Load SF current-dataset CSV → raw_reports → incidents."""
    snapshot_date = snapshot_date or date.today()

    # ── Read CSV ──────────────────────────────────────────────────────────────
    log.info("Reading %s ...", csv_path)
    raw = pd.read_csv(
        csv_path,
        low_memory=False,
        dtype={
            "Row ID":          str,
            "Incident Number": str,
            "Incident ID":     str,
            "CAD Number":      str,
            "Incident Code":   str,
        },
    )
    total_rows = len(raw)
    log.info("Loaded %d source rows", total_rows)

    # ── Rename + normalise ────────────────────────────────────────────────────
    df = raw.rename(columns=_CSV_RENAME)

    df["category"]      = df["category_raw"].map(_norm_category)
    df["resolution"]    = df["resolution_raw"].map(_norm_resolution)
    df["city"]          = "sf"
    df["dataset"]       = "current"
    df["snapshot_date"] = snapshot_date.isoformat()

    df["occurred_at"] = pd.to_datetime(df["occurred_at"], format="mixed", errors="coerce")
    df["reported_at"] = pd.to_datetime(df["reported_at"], format="mixed", errors="coerce")

    # ── Drop-tracking (surfaced, not silently discarded) ──────────────────────
    n_null_lat  = int(df["lat"].isna().sum())
    n_null_cat  = int(df["category_raw"].isna().sum())
    n_null_ts   = int(df["occurred_at"].isna().sum())
    log.info(
        "DROP STATS (rows kept in raw_reports, excluded at API layer): "
        "null coords=%d (%.2f%%), null category=%d (%.2f%%), "
        "unparseable occurred_at=%d (%.2f%%)",
        n_null_lat,  100 * n_null_lat  / total_rows,
        n_null_cat,  100 * n_null_cat  / total_rows,
        n_null_ts,   100 * n_null_ts   / total_rows,
    )

    df_load = df[_DB_COLS].copy()

    # ── COPY → raw_reports ────────────────────────────────────────────────────
    log.info("Connecting to DB ...")
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            buf = io.StringIO()
            df_load.to_csv(buf, index=False, header=True, na_rep="")
            buf.seek(0)
            cols = ", ".join(_DB_COLS)
            cur.copy_expert(
                f"COPY raw_reports ({cols}) FROM STDIN "
                "WITH (FORMAT CSV, HEADER true, NULL '')",
                buf,
            )
        conn.commit()
        log.info("raw_reports loaded")

        # ── Derive incidents ──────────────────────────────────────────────────
        log.info("Deriving incidents (window functions) ...")
        with conn.cursor() as cur:
            cur.execute(_INCIDENTS_SQL, {"city": "sf", "dataset": "current"})
        conn.commit()
        log.info("incidents derived")

        # ── Acceptance counts ─────────────────────────────────────────────────
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM raw_reports WHERE city = 'sf' AND dataset = 'current'"
            )
            rr = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM incidents WHERE city = 'sf'"
            )
            inc = cur.fetchone()[0]
            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE has_supplement)           AS with_supplement,
                    COUNT(*) FILTER (WHERE resolution_changed)       AS changed,
                    COUNT(*) FILTER (WHERE orphan_supplement_only)   AS orphan
                FROM incidents WHERE city = 'sf'
                """
            )
            row = cur.fetchone()

        log.info("─" * 60)
        log.info("ACCEPTANCE")
        log.info("  raw_reports rows : %d  (expected 1,042,932)", rr)
        log.info("  incidents rows   : %d  (unique Incident Numbers)", inc)
        log.info("  with supplement  : %d  (~%.1f%%)", row[0], 100 * row[0] / inc if inc else 0)
        log.info("  resolution changed: %d  (~%.1f%%)", row[1], 100 * row[1] / inc if inc else 0)
        log.info("  orphan suppl only : %d  (no initial in dataset)", row[2])
        log.info("─" * 60)

    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load SF current-dataset CSV into LENS DB")
    parser.add_argument("--csv", required=True, help="Path to SF current-dataset CSV")
    parser.add_argument(
        "--db",
        default=os.environ.get("DATABASE_URL", "postgresql://lens:lens@localhost:5432/lens"),
        help="PostgreSQL connection URL",
    )
    parser.add_argument(
        "--snapshot-date",
        help="ISO date for snapshot_date column (default: today)",
    )
    args = parser.parse_args()
    snap = date.fromisoformat(args.snapshot_date) if args.snapshot_date else None
    run(args.csv, args.db, snap)
